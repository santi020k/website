---
title: Development Workflow with Husky for Next.js, ESLint, and Vitest Integration
description: >-
  A practical Husky setup for Next.js projects so linting, testing, and
  pre-push checks become part of the team workflow instead of a last-minute
  cleanup step.
publishDate: '2024-03-21T17:47:55.000Z'
tags:
  - pre-commit
  - vitest
  - husky
  - react
  - nextjs
coverImage:
  alt: Development workflow diagram showing Husky pre-commit and pre-push hooks
  src: ./development-workflow-with-husky-for-next-js-eslint-and-vitest-integration.png
canonicalUrl: "https://medium.com/@santi020k/development-workflow-with-husky-for-next-js-eslint-and-vitest-integration-d75548e48092"
---

[Read the Previous Post: Building the Best Next.js TypeScript ESLint Configuration](https://medium.com/@santi020k/building-the-best-next-js-typescript-standard-vitest-eslint-configuration-f6d91d6346e7)

[GitHub Repository](https://github.com/santi020k/posts/tree/post-3)

Implementing a robust pre-commit system can significantly reduce pull request review time. By enforcing ESLint rules, ensuring passing tests, and maintaining a stable build, developers can avoid pushing broken builds and the subsequent need for corrective commits.

This approach improves code quality while reducing CI/CD expenses.

## Setting Up Pre-commit and Pre-push

Start by installing the required dependencies:

```bash title="terminal"
npm install --save-dev husky lint-staged
# or
yarn add husky lint-staged --dev
```

To organize Husky within a `config` folder, modify your `package.json`:

```json title="package.json"
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest",
    "pre-commit": "lint-staged && vitest run",
    "pre-push": "eslint . --fix --max-warnings=0 && npm run build",
    "prepare": "husky install config/.husky"
  },
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": [
      "eslint --fix"
    ]
  }
}
```

This establishes commands for pre-commit and pre-push operations. Customize according to your project requirements.

### Description of Actions

The `pre-commit` script executes linting with fixes and runs tests before allowing commits:

```json title="package.json"
"pre-commit": "lint-staged && vitest run"
```

The `pre-push` script enforces strict linting standards and triggers the build process:

```json title="package.json"
"pre-push": "eslint . --fix --max-warnings=0 && npm run build"
```

Execute the prepare command to generate the hook files:

```bash title="terminal"
npm run prepare
# or
yarn run prepare
```

This generates the necessary files in the `config/.husky` directory. These files allow Husky to execute the specified commands whenever a commit or push is made.

If you ever need to bypass Husky's verification — for example during a work in progress — you can use `--no-verify`:

```bash title="terminal"
git commit . -m 'quick fix' --no-verify
```

Bypassing verification risks overlooking console errors and is not recommended as a regular practice.

## Conclusions

- Husky pre-commit and pre-push hooks improve code stability through enforced linting and testing protocols.
- Organizing configurations within a dedicated `config` folder maintains project cleanliness and simplifies maintenance.
- Early error detection reduces corrective commits and workflow disruptions.
- While bypass options exist, circumventing verification processes compromises code reliability.
- Integrating Husky fosters quality-focused development practices and a culture of continuous improvement.

[Next Post: Storybook in Action with Next.js, Tailwind and TypeScript](https://medium.com/@santi020k/storybook-in-action-with-next-js-tailwind-and-typescript-dd95875856a2)
