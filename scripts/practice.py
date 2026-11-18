"""Read selected Development Practice at one GitHub commit using existing gh access.

No installation, execution of retrieved text, writes, cache, or policy promotion.
"""
import argparse
import base64
import hashlib
import json
from pathlib import Path
import re
import subprocess
import sys
from urllib.parse import quote

ROOT = Path(__file__).resolve().parents[1]
PROFILES = ('prototype', 'product', 'infrastructure')
SKILLS = ('discover', 'build', 'review', 'reference-to-build')


def github_get(endpoint):
    result = subprocess.run(['gh', 'api', '--hostname', 'github.com', '--method', 'GET', endpoint],
                            capture_output=True, text=True, timeout=30)
    if result.returncode:
        # Do not echo CLI diagnostics that could contain credential or account details.
        raise ValueError('GitHub read failed; check gh authentication and repository access')
    return json.loads(result.stdout)


def read_practice(config, profile=None, skill=None, get=github_get):
    repository = config['repository']
    if not re.fullmatch(r'[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+', repository):
        raise ValueError('Invalid source repository')
    if profile is not None and profile not in PROFILES:
        raise ValueError('Unknown profile')
    if skill is not None and skill not in SKILLS:
        raise ValueError('Unknown skill')
    head = get(f"repos/{repository}/commits/{quote(config['tracking_ref'], safe='')}")
    revision = head['sha']
    if not re.fullmatch(r'[0-9a-f]{40}', revision):
        raise ValueError('Expected an exact Git commit')
    paths = ['PRACTICE.md', 'docs/DECISIONS.md']
    if profile:
        paths.append(f'profiles/{profile}.md')
    if skill:
        paths.append(f'skills/{skill}/SKILL.md')
    documents = []
    for path in paths:
        # Once resolved, every document is read at that SHA even if main advances.
        data = get(f'repos/{repository}/contents/{path}?ref={revision}')
        if data.get('type') != 'file' or data.get('encoding') != 'base64' or data.get('path') != path:
            raise ValueError('Expected an ordinary source file: ' + path)
        encoded = data['content']
        if len(encoded) > 100000:
            raise ValueError('Selected source exceeds the bounded reader limit')
        raw = base64.b64decode(''.join(encoded.split()), validate=True)
        if len(raw) > 65536:
            raise ValueError('Selected source exceeds 64 KiB')
        documents.append({'path': path, 'url': f'https://github.com/{repository}/blob/{revision}/{path}',
                          'sha256': hashlib.sha256(raw).hexdigest(), 'text': raw.decode('utf-8')})
    return {
        'schema': 'project-template.practice-context/v1', 'state': 'read',
        'repository': repository, 'tracking_ref': config['tracking_ref'], 'resolved_commit': revision,
        'reference_commit': config['reference_commit'],
        'changed_since_template_review': revision != config['reference_commit'],
        'profile': profile, 'skill': skill, 'documents': documents,
        'authority': 'Advisory source context. Source approval status is retained in the text; read does not mean accepted or applied.',
        'next': 'Inspect selected guidance against project constraints; record used revision, selection, exceptions and outcome in the handoff.',
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--profile', choices=PROFILES)
    parser.add_argument('--skill', choices=SKILLS)
    args = parser.parse_args()
    try:
        config = json.loads((ROOT / '.practice/source.json').read_text())
        packet = read_practice(config, args.profile, args.skill)
    except (ValueError, KeyError, TypeError, OSError, subprocess.SubprocessError) as error:
        print(json.dumps({'state': 'unavailable', 'message': str(error),
                          'fallback': 'Use project-local instructions; report the missing live practice read.'}), file=sys.stderr)
        return 1
    print(json.dumps(packet, indent=2, ensure_ascii=False))
    return 0


if __name__ == '__main__':
    sys.exit(main())
