"""Fail closed around the unchanged upstream advisory reviewer."""
import json
import sys


def verify(outcome, expected_commit):
    if not expected_commit or outcome.get('commit') != expected_commit:
        raise ValueError('Review does not match the current PR commit')
    if outcome.get('status') != 'ok':
        raise ValueError('AI review is unavailable or incomplete')
    if outcome.get('truncated') or outcome.get('unreviewed'):
        raise ValueError('AI review exceeded its coverage budget')
    if outcome.get('chunks_ok') != outcome.get('chunks'):
        raise ValueError('Not all review requests succeeded')
    if not isinstance(outcome.get('findings'), list):
        raise ValueError('Missing review findings')
    for finding in outcome['findings']:
        severity = finding.get('severity')
        if severity not in ('info', 'minor'):
            raise ValueError('AI review has major/critical or invalid findings')


if __name__ == '__main__':
    try:
        with open(sys.argv[1], encoding='utf-8') as source:
            verify(json.load(source), sys.argv[2])
    except (OSError, ValueError, KeyError, TypeError, IndexError) as error:
        print('AI review gate blocked: ' + str(error))
        sys.exit(1)
    print('AI review gate passed for ' + sys.argv[2])
