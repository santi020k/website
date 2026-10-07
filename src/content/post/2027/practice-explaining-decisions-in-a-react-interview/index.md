---
title: "Practice Explaining Decisions in a React Interview"
description: "A small search exercise for practicing requirements, state, failure cases, and tradeoffs before a React technical interview."
publishDate: "2027-06-01T14:00:00.000Z"
draft: true
coverImage:
  alt: "Loose lilac puzzle pieces form a simple bridge with a cyan joint between two off-white supports"
  src: "./cover.webp"
tags: ["react", "interviews", "career", "community", "testing"]
postType: "Guide"
---

In January 2024, I gave “Surviving Technical Interviews in React” at ReactJS Medellín. Thinking out loud was part of that talk's focus: making the reasoning behind an implementation understandable to someone else.

My work with [ReactJS Colombia](/portfolio/react-js-colombia/) gives that topic a broader purpose. A useful practice session should give people something concrete to try, even when they are still building confidence.

Here is one exercise for practicing explanation alongside implementation, with a small enough scope to try on your own or with a friend.

## Begin with an intentionally incomplete prompt

“Build a page that searches a list of projects.”

Before opening the editor, identify what you need to know. Is the list already available locally? Does typing trigger a request, or is there a submit button? What should an empty query show? Which fields are searchable?

For this exercise, choose a small local list, case-insensitive matching on project names, immediate filtering, and all projects visible when the query is empty. Say those assumptions aloud.

This turns an ambiguous prompt into a task you can complete. If the interviewer gives different constraints, adjust the plan before building around the wrong assumption.

## Explain the smallest state model

With a fixed local list, the changing input is the query. The matching projects can be calculated from that query and the source list during rendering.

Keeping a second state value for the filtered list introduces another value to synchronize. The [React guidance on choosing state structure](https://react.dev/learn/choosing-the-state-structure) explains why redundant state is worth avoiding.

A useful explanation is specific: “I will keep the query in state and derive the visible projects because the result is determined by the query and the list.”

That gives your partner something to inspect and challenge. Saying “this is best practice” reveals much less about why the choice fits this task.

## Make the empty result part of the feature

A search that only works when it finds a match leaves an ordinary case unexplained.

Try a query with no results. The page should distinguish an empty result from a broken application and make it straightforward to change or clear the query.

Give the input a meaningful label. Check that someone can reach and use it with a keyboard. Keep the project links understandable when several results appear together.

These details help complete the requested behavior. They also create useful discussion about what deserves to be included in the available time.

## Change one constraint

Now replace the local list with a remote search service.

The problem has changed. Requests take time and can fail. A response for an earlier query can arrive after a later response. A person may type several characters before the first request completes.

Pause and explain the new responsibilities before adding code: loading, failure recovery, request frequency, and ensuring outdated results do not replace the current query's results. The [React guidance on fetching data in Effects](https://react.dev/reference/react/useEffect#fetching-data-with-effects) illustrates the stale-response problem and discusses framework alternatives.

In an existing application, first inspect its established data-loading approach. In the exercise, state the approach you are choosing and why. You do not need to invent a reusable fetching framework to demonstrate that you understand the boundary.

## Test the decisions you described

For the local version, check an empty query, a partial match, different letter casing, and no matches. For the remote extension, add a failed response and responses arriving in a different order from the requests.

Explain what each case would reveal. A test list is easier to assess when it connects directly to a behavior you promised.

If time runs out, describe what remains and its consequence. “The remote version still needs protection against stale responses” is more useful than a vague claim that the solution only needs polish.

## Practice with one person listening

Ask a friend to listen for three things: assumptions you never stated, changes they could not follow, and claims your example did not demonstrate. Then repeat the exercise with one improvement.

You are practicing how to make technical decisions reviewable while solving a small problem. That skill also matters in everyday code review and pair programming.

For the original session, you can [watch the React interview talk](https://www.youtube.com/watch?v=UtBZP93cOUs) and use the exercise above as a follow-up practice round.
