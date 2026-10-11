"""Regression tests for strict, bounded model-response recovery."""
import json
import unittest
from unittest import mock
from test_review import review, FakeResponse, chat_reply, file_diff


class ResponseRecoveryTests(unittest.TestCase):
    def cfg(self):
        return review.Config(key='test')

    def finding(self, **changes):
        return dict(dict(file='a.py', line=1, severity='major', category='correctness',
                         title='Reachable failure', rationale='Evidence', confidence='low'), **changes)

    def test_invalid_schemas_fail_closed(self):
        for value in ({}, {'findings': []}, {'summary': '', 'findings': {}},
                      {'summary': '', 'findings': [{'title': 'bad'}]},
                      {'summary': '', 'findings': [self.finding(severity='unknown')]},
                      {'summary': '', 'findings': [self.finding(line=True)]}):
            with self.subTest(value=value):
                self.assertFalse(review.parse_strict_reply(json.dumps(value)).ok)

    def test_valid_major_is_preserved_and_never_retried(self):
        with mock.patch.object(review.urllib.request, 'urlopen', return_value=FakeResponse(200, chat_reply([self.finding()]))) as request:
            result = review.call_gateway(self.cfg(), 'diff', ['a.py'])
        self.assertTrue(result.ok)
        self.assertEqual(result.findings[0].severity, 'major')
        self.assertEqual(request.call_count, 1)

    def test_truncated_valid_json_is_rejected_with_bounded_retry(self):
        payload = chat_reply([])
        payload['choices'][0]['finish_reason'] = 'length'
        with mock.patch.object(review.urllib.request, 'urlopen', return_value=FakeResponse(200, payload)) as request:
            result = review.call_gateway(self.cfg(), 'diff', ['a.py'])
        self.assertFalse(result.ok)
        self.assertEqual(request.call_count, 2)
        self.assertIn('finish_reason=length', result.error)

    def test_invalid_then_complete_retries_same_diff_once_at_4000(self):
        bad = chat_reply([])
        bad['choices'][0]['message']['content'] = '{broken'
        with mock.patch.object(review.urllib.request, 'urlopen', side_effect=[FakeResponse(200, bad), FakeResponse(200, chat_reply([]))]) as request:
            result = review.call_gateway(self.cfg(), 'same diff', ['a.py'])
        self.assertTrue(result.ok)
        bodies = [json.loads(c.args[0].data) for c in request.call_args_list]
        self.assertEqual(bodies[0]['messages'], bodies[1]['messages'])
        self.assertEqual(bodies[1]['max_tokens'], 4000)

    def test_out_of_scope_finding_cannot_silently_disappear(self):
        with mock.patch.object(review.urllib.request, 'urlopen', return_value=FakeResponse(200, chat_reply([self.finding(file='elsewhere.py')]))):
            result = review.call_gateway(self.cfg(), 'diff', ['a.py'])
        self.assertFalse(result.ok)

    def test_incomplete_response_cannot_count_as_covered(self):
        with mock.patch.object(review.urllib.request, 'urlopen', return_value=FakeResponse(200, chat_reply([], summary=None))):
            result = review.run_review(self.cfg(), file_diff('a.py'))
        self.assertEqual(result.chunks_ok, 0)
        self.assertEqual(result.status, 'unavailable')
