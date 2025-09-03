module.exports = {
  branches: ['release'],
  tagFormat: 'v${version}',
  repositoryUrl: 'https://github.com/ruforms/primitives',
  plugins: [
    [
      '@semantic-release/commit-analyzer',
      {
        preset: 'angular',
        releaseRules: [
          // Alpha development: only patch releases
          { type: 'feat', release: 'patch' },
          { type: 'fix', release: 'patch' },
          { type: 'docs', release: false },      // Don't release for docs
          { type: 'style', release: false },     // Don't release for style
          { type: 'refactor', release: 'patch' },
          { type: 'perf', release: 'patch' },
          { type: 'test', release: false },      // Don't release for tests
          { type: 'chore', release: false },     // Don't release for chore
          { type: 'ci', release: false },
          // Force breaking changes to be patch during alpha
          { breaking: true, release: 'patch' },
        ],
        parserOpts: {
          noteKeywords: ['BREAKING CHANGE', 'BREAKING CHANGES'],
        },
      },
    ],
    [
      '@semantic-release/release-notes-generator',
      {
        preset: 'angular',
        writerOpts: {
          groupBy: 'type',
          commitGroupsSort: 'title',
          commitsSort: ['scope', 'subject'],
        },
      },
    ],
    [
      '@semantic-release/changelog',
      {
        changelogFile: 'CHANGELOG.md',
        changelogTitle: '# Changelog\n\nAll notable changes to this project will be documented in this file.',
      },
    ],
    [
      '@semantic-release/exec',
      {
        prepareCmd: 'node src/scripts/resolve-workspace-deps.cjs',
      },
    ],
    '@semantic-release/npm',
    [
      '@semantic-release/git',
      {
        assets: ['CHANGELOG.md'], // Don't commit package.json changes
        message: 'chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}',
      },
    ],
    [
      '@semantic-release/github',
      {
        draft: false,
        successComment: false,
        failComment: false,
      },
    ],
  ],
}
