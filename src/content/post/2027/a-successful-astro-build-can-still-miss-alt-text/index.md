---
title: "A Successful Astro Build Can Still Miss Alt Text"
description: "A small image example shows where compilation ends, Astro Doctor helps, and human judgment still decides whether the fix is useful."
publishDate: "2027-02-02T14:00:00.000Z"
draft: true
coverImage:
  alt: "A glass diagnostic lens reveals an amber inset in a stack of violet page blocks"
  src: "./cover.webp"
tags: ["astro", "accessibility", "developer-tools", "testing"]
postType: "Guide"
---

A page can compile successfully while an important image has no useful text alternative.

That is one of the gaps I built [Astro Doctor](/blog/astro-doctor-announcement/) to help find. A build checks whether the application can be produced. A diagnostic can ask a narrower question about the source. Neither replaces checking what a person actually experiences.

Missing alternative text is a small example with a clear boundary: a tool can notice an absent attribute, but someone still needs to decide what the image means in context.

## Start with a concrete failure

Imagine an article explaining how to connect a sensor. This illustrative Astro markup displays the wiring diagram:

```html
<img
  src="/images/sensor-wiring.webp"
  width="960"
  height="540"
/>
```

The browser has enough information to request and display the file. That does not give someone who cannot see it the information needed to connect the sensor.

The important question is whether the surrounding article communicates the wiring instructions independently. If the diagram is the only place the connections are explained, a successful build has left a real gap.

This example uses a plain image element to isolate the issue. Your production image pipeline may provide additional validation, optimization, or required props. Keep those protections too.

## Let the diagnostic identify the missing decision

Astro Doctor includes the `astro-doctor/no-missing-alt` rule. Its [scanner tests](https://github.com/santi020k/astro-doctor/blob/main/packages/astro-doctor/tests/scanner/index.test.ts) cover images with missing alternative text.

When that diagnostic appears, treat it as a request to review the image's purpose. Adding an attribute is only the mechanical part of the repair.

For the sensor example, a more useful starting point would be:

```html
<img
  src="/images/sensor-wiring.webp"
  width="960"
  height="540"
  alt="Sensor wiring diagram; the connections are listed below."
/>
```

The article must then actually provide the connection list. The wording above is appropriate only if it matches the real image and its surrounding explanation. It is not a substitute for verifying the diagram.

A complex image can need more than a short attribute. Put the full explanation where readers can use it, including people who can see the image but find the diagram difficult to interpret.

## Choose text based on purpose

The [W3C image guidance](https://www.w3.org/WAI/tutorials/images/) distinguishes images that convey information, add decoration, or perform an action.

For an informative image, describe the information that matters here. For a purely decorative image, use `alt=""`. For an image that is the only content of a link or button, communicate the action or destination. Complex diagrams also need a fuller text equivalent.

The same picture can need different treatment in different places. That context is why a rule cannot safely invent the answer for every image.

## Verify the repair at two levels

First, rerun the diagnostic. This confirms that the source now satisfies the checked condition. Keep the repository's normal build and other checks in the same validation pass.

Then review the rendered article with the image's information in mind:

- Can a reader understand the instructions from the text?
- Does the alternative text match this particular image?
- Does a linked image have a useful accessible name?
- Does the surrounding copy support the description without needless repetition?

A screen reader check can help verify how the image and nearby text are announced. It should use the actual page, because placement and surrounding content are part of the experience.

## Keep the evidence specific

After this repair, it is reasonable to say that the missing-alt diagnostic is resolved and the image's explanation has been reviewed.

It would be a much larger claim to call the entire page accessible. Headings, contrast, keyboard interaction, forms, motion, and other images still have their own questions.

That distinction makes automated checks more useful. Each check supplies evidence for a defined condition; the product review connects those conditions to the task a person is trying to complete.

For your next Astro review, pick one informative image and check whether its meaning survives without seeing it. That small exercise often makes the difference between satisfying a rule and improving the page.
