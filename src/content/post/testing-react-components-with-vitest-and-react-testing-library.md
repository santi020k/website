---
title: "Testing React Components with Vitest and React Testing Library"
description: "A practical setup for testing React components with Vitest and React Testing Library, focused on behavior, confidence, and maintainable frontend code."
publishDate: "2024-04-11T15:46:53.731Z"
tags: ["vitest", "testing-library", "react", "typescript", "nextjs"]
coverImage:
  alt: "Neon illustration of a component test panel connected to interaction, assertion, and targeting checkpoints"
  src: "./testing-react-components-with-vitest-and-react-testing-library-cover.webp"
postType: "Tutorial"
seriesId: "building-a-production-nextjs-app"
seriesOrder: 5
---

[Read the Previous Post: Storybook in Action with Next.js, Tailwind and TypeScript](https://medium.com/towardsdev/storybook-in-action-with-next-js-tailwind-and-typescript-dd95875856a2)

After using Storybook to isolate and review components visually, the next step is to validate behavior with tests. I like that combination because Storybook improves the development experience, while tests reduce fear when the component starts changing over time.

In frontend projects, one of the most common mistakes is believing that visual review alone is enough. It is not. A component can look correct and still fail when a user clicks, types, submits, or triggers a state change that nobody checked manually.

That is why I prefer to add component tests early, before the UI becomes too large and the cost of missing behavior grows with every release.

## Why Vitest and React Testing Library?

For React projects, I prefer this combination for a simple reason: it is practical.

- **Vitest** is fast, modern, and fits nicely in projects that already use Vite or tooling inspired by that ecosystem.
- **React Testing Library** encourages tests that focus on what the user can actually perceive and do.
- The combination is strong enough for real projects without adding unnecessary complexity from day one.

What I do not want is a test suite that feels heavy, slow, or too coupled to implementation details. That kind of setup usually gets ignored by the team very quickly.

## Installing the dependencies

Start by installing the testing packages:

```bash title="terminal"
npm install --save-dev vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
# or
yarn add --dev vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

If the project already uses TypeScript, there is no need to over-complicate the setup. Keep the initial configuration small and only add more layers when the project really needs them.

## Vitest base configuration

Create a `vitest.config.ts` file like this:

```typescript title="vitest.config.ts"
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/tests/setup.ts']
  }
})
```

The important part here is `jsdom`, because component tests usually need a browser-like environment. Without that, your tests will fail the moment they interact with the DOM.

Then create the setup file:

```typescript title="src/tests/setup.ts"
import '@testing-library/jest-dom/vitest'
```

This gives you more useful assertions such as:

- `toBeInTheDocument`
- `toBeDisabled`
- `toHaveTextContent`

Those assertions make tests easier to read, and readable tests are much easier to maintain.

## Example component

Let’s use a simple button component:

```tsx title="src/components/atoms/button/button.tsx"
interface ButtonProps {
  children: React.ReactNode
  disabled?: boolean
  onClick?: () => void
}

const Button = ({ children, disabled = false, onClick }: ButtonProps) => (
  <button
    disabled={disabled}
    onClick={onClick}
    type="button"
  >
    {children}
  </button>
)

export default Button
```

This example is intentionally small. When I write a post, I prefer examples that are easy to reason about instead of giant demo components that distract from the testing approach.

## The first useful test

Now write a test that checks what matters to the user:

```tsx title="src/components/atoms/button/button.test.tsx"
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'

import Button from './button'

describe('Button', () => {
  it('renders the label', () => {
    render(<Button>Save changes</Button>)

    expect(
      screen.getByRole('button', { name: /save changes/i })
    ).toBeInTheDocument()
  })

  it('calls onClick when pressed', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()

    render(<Button onClick={onClick}>Save</Button>)

    await user.click(screen.getByRole('button', { name: /save/i }))

    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('does not allow interaction when disabled', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()

    render(
      <Button disabled onClick={onClick}>
        Save
      </Button>
    )

    const button = screen.getByRole('button', { name: /save/i })

    expect(button).toBeDisabled()

    await user.click(button)

    expect(onClick).not.toHaveBeenCalled()
  })
})
```

What I like about this test file is that it checks behavior instead of implementation.

I am not testing:

- Internal state names
- CSS class names
- Whether a helper function was called internally

I am testing what the user can observe:

- The button is present
- The button reacts correctly
- The disabled state works

That distinction is very important. If the test suite depends too much on implementation details, refactoring becomes painful even when the user-facing behavior does not change.

## Prefer accessible queries

One of the best habits in React Testing Library is querying the UI the same way a user or assistive technology would.

I recommend prioritizing queries like these:

1. `getByRole`
2. `getByLabelText`
3. `getByText`
4. `getByPlaceholderText`

If I can find a component by role and accessible name, that usually means the markup is also in better shape for real users. This is another reason I like the library: it pushes the team toward better accessibility patterns almost by accident.

## Test the behavior, not the framework

In many React projects, developers spend too much time testing things that React, Next.js, or the browser already guarantee.

For example, I do not see much value in testing trivial implementation details such as:

- Whether a `useState` hook exists
- Whether a component has a specific wrapper `div`
- Whether a prop is passed to an internal child that the user never interacts with

I prefer to test:

- Visible state changes
- Form validation
- User interactions
- Rendering conditions
- Content that should or should not appear

That gives much better long-term value.

## Add a test script to the project

Update your `package.json` with the basic scripts:

```json title="package.json"
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

Then run:

```bash title="terminal"
npm run test
```

Once this works, you can connect it later to pre-commit hooks, CI, or deployment gates. That is where tests start becoming part of the workflow instead of something developers remember only before release day.

## Conclusions

- Vitest and React Testing Library are a practical combination for modern React projects.
- Tests should focus on behavior that matters to the user, not internal implementation details.
- Accessible queries usually lead to better test quality and better component markup.
- A lightweight test setup early in the project is much better than a large test migration later.
- Good component tests reduce fear when refactoring UI code.

[Next Post: Continuous Integration and Deployment (CI/CD) for Next.js Projects](https://santi020k.me/blog/continuous-integration-and-deployment-for-next-js-projects/)
