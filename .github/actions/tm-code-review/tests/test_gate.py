import importlib.util
import pathlib
import unittest

spec = importlib.util.spec_from_file_location('gate', pathlib.Path(__file__).parents[1] / 'gate.py')
gate = importlib.util.module_from_spec(spec)
spec.loader.exec_module(gate)


class GateTests(unittest.TestCase):
    def result(self, **changes):
        return dict(dict(commit='head', status='ok', truncated=False, unreviewed=[], chunks=1, chunks_ok=1, findings=[]), **changes)

    def test_completed_review_passes(self):
        gate.verify(self.result(), 'head')

    def test_failures_block(self):
        cases = [dict(commit='old'), dict(status='unavailable'), dict(status='partial'),
                 dict(truncated=True), dict(unreviewed=['app.py']), dict(chunks_ok=0),
                 dict(findings=None), dict(findings=[dict(severity='major')]),
                 dict(findings=[dict(severity='critical')]), dict(findings=[dict(severity='unknown')])]
        for change in cases:
            with self.subTest(change=change), self.assertRaises(ValueError):
                gate.verify(self.result(**change), 'head')

    def test_minor_findings_are_advisory(self):
        gate.verify(self.result(findings=[dict(severity='minor')]), 'head')

    def test_missing_expected_or_reported_commit_blocks(self):
        for expected in (None, ''):
            with self.subTest(expected=expected), self.assertRaises(ValueError):
                gate.verify(self.result(commit=expected), expected)
        result = self.result()
        del result['commit']
        with self.assertRaises(ValueError):
            gate.verify(result, 'head')
