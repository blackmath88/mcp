import base64
from pathlib import Path
import sys
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
from practice import read_practice


class Practice(unittest.TestCase):
    def setUp(self):
        self.calls = []
        self.revision = 'a' * 40
        self.config = {'repository': 'example/practice', 'tracking_ref': 'main', 'reference_commit': 'b' * 40}

    def get(self, endpoint):
        self.calls.append(endpoint)
        if '/commits/' in endpoint:
            return {'sha': self.revision}
        path = endpoint.split('/contents/')[1].split('?')[0]
        return {'type': 'file', 'path': path, 'encoding': 'base64',
                'content': base64.b64encode(b'# Proposed, unvalidated guidance\n').decode()}

    def test_resolves_once_and_pins_all_selected_reads(self):
        packet = read_practice(self.config, 'prototype', 'build', self.get)
        self.assertEqual(len(self.calls), 5)
        self.assertTrue(all(c.endswith('?ref=' + self.revision) for c in self.calls[1:]))
        self.assertEqual(len(packet['documents']), 4)
        self.assertTrue(packet['changed_since_template_review'])
        self.assertIn('Proposed, unvalidated', packet['documents'][0]['text'])
        self.assertEqual(packet['state'], 'read')

    def test_minimal_selection_and_unchanged_revision(self):
        self.config['reference_commit'] = self.revision
        packet = read_practice(self.config, get=self.get)
        self.assertEqual(len(packet['documents']), 2)
        self.assertFalse(packet['changed_since_template_review'])

    def test_denied_source_does_not_return_partial_context(self):
        def denied(endpoint):
            if '/contents/docs/' in endpoint:
                raise ValueError('Access denied')
            return self.get(endpoint)
        with self.assertRaisesRegex(ValueError, 'Access denied'):
            read_practice(self.config, get=denied)

    def test_rejects_unknown_selection_before_network(self):
        with self.assertRaises(ValueError):
            read_practice(self.config, '../other', get=self.get)
        self.assertEqual(self.calls, [])

    def test_rejects_symlink_source(self):
        def symlink(endpoint):
            result = self.get(endpoint)
            if '/contents/' in endpoint:
                result['type'] = 'symlink'
            return result
        with self.assertRaises(ValueError):
            read_practice(self.config, get=symlink)

    def test_rejects_oversized_source(self):
        def oversized(endpoint):
            result = self.get(endpoint)
            if '/contents/' in endpoint:
                result['content'] = base64.b64encode(b'x' * 65537).decode()
            return result
        with self.assertRaises(ValueError):
            read_practice(self.config, get=oversized)


if __name__ == '__main__':
    unittest.main()
