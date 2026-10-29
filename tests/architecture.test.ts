import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { basename, join, posix } from 'node:path';

const rules: Record<string, string[]> = {
  domain: ['domain'], commands: ['commands', 'domain'],
  application: ['application', 'domain', 'commands'],
  infrastructure: ['infrastructure', 'domain', 'application'],
  cli: ['cli', 'application', 'commands', 'domain']
};

test('every source import follows the documented layer direction', () => {
  for (const [layer, allowed] of Object.entries(rules)) {
    for (const name of readdirSync(join('src', layer))) {
      const source = readFileSync(join('src', layer, name), 'utf8');
      for (const match of source.matchAll(/from\s+['"]([^'"]+)['"]/g)) {
        const dependency = match[1];
        if (dependency.startsWith('.')) {
          const target = posix.normalize(posix.join(layer, dependency)).split('/')[0];
          assert.ok(allowed.includes(target), layer + '/' + name + ' -> ' + dependency);
        } else {
          assert.ok(['cli', 'infrastructure'].includes(layer), 'external dependency in ' + layer);
        }
      }
    }
  }
});

test('source classes are one per file and match their filenames', () => {
  for (const layer of Object.keys(rules)) {
    for (const name of readdirSync(join('src', layer))) {
      const source = readFileSync(join('src', layer, name), 'utf8');
      const classes = [...source.matchAll(/export\s+(?:abstract\s+)?class\s+(\w+)/g)];
      assert.ok(classes.length <= 1, name);
      if (classes.length) assert.equal(classes[0][1], basename(name, '.ts'));
    }
  }
});
