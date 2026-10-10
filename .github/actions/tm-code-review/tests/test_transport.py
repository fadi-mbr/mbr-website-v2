import io
import json
import pathlib
import sys
import unittest
import urllib.error
from unittest import mock

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))
import review
from test_review import FakeResponse, chat_reply, file_diff


class TransportTests(unittest.TestCase):
    @mock.patch('review.time.sleep')
    def test_rate_limit_recovers_with_bounded_backoff(self, sleep):
        error = urllib.error.HTTPError('https://invalid', 429, 'limit', {}, io.BytesIO(b'sensitive'))
        with mock.patch('review.urllib.request.urlopen', side_effect=[error, FakeResponse(200, chat_reply([]))]) as call:
            result = review.call_gateway(review.Config(key='fixture'), 'diff', ['x.py'])
        self.assertTrue(result.ok)
        self.assertEqual(call.call_count, 2)
        sleep.assert_called_once_with(5)

    @mock.patch('review.time.sleep')
    def test_exhausted_rate_limit_remains_failed_and_redacted(self, sleep):
        errors = [urllib.error.HTTPError('https://invalid', 429, 'limit', {}, io.BytesIO(b'sensitive')) for _ in range(3)]
        with mock.patch('review.urllib.request.urlopen', side_effect=errors) as call:
            result = review.call_gateway(review.Config(key='fixture'), 'diff', ['x.py'])
        self.assertFalse(result.ok)
        self.assertEqual(result.kind, 'rate_limited')
        self.assertEqual(result.error, 'HTTP 429')
        self.assertEqual(call.call_count, 3)
        self.assertEqual(sleep.call_args_list, [mock.call(5), mock.call(10)])

    def test_scope_is_present_in_each_request(self):
        cfg = review.Config(key='fixture', review_context='Approved retirement of booking')
        with mock.patch('review.urllib.request.urlopen', return_value=FakeResponse(200, chat_reply([]))) as call:
            for text in ['first part', 'second part']:
                review.call_gateway(cfg, text, ['x.py'])
        for request in call.call_args_list:
            body = json.loads(request.args[0].data)
            self.assertIn(cfg.review_context, body['messages'][0]['content'])

    @mock.patch('review.time.sleep')
    def test_unavailable_after_success_stops_with_partial_coverage(self, sleep):
        cfg = review.Config(key='fixture', chunk_chars=50, max_chunks=10)
        diff = file_diff('a.py') + file_diff('b.py') + file_diff('c.py')
        with mock.patch('review.call_gateway', side_effect=[review.GatewayResult(True), review.GatewayResult(False, 'unavailable', error='HTTP 503')]) as call:
            result = review.run_review(cfg, diff)
        self.assertEqual(result.status, 'partial')
        self.assertEqual(result.chunks_ok, 1)
        self.assertGreater(result.chunks, result.chunks_ok)
        self.assertEqual(call.call_count, 2)

    def test_mock_cannot_replace_network_opener(self):
        original = review.urllib.request.urlopen
        with self.assertRaises(SystemExit):
            review.main(['--dry-run', '--mock-reply', 'not-read.json'])
        self.assertIs(review.urllib.request.urlopen, original)
