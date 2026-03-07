Remember that `React.FormEvent` is deprecated. The deprecation notice is: 

> FormEvent doesn’t actually exist. You probably meant to use ChangeEvent, InputEvent, SubmitEvent, or just SyntheticEvent instead depending on the event type.

Favour keeping component files short by breaking out subcomponents, even if they're only used on one place.

In our `pages/` tree, any page with more than trivial complexity should be expressed as a React component, located nearby under a `_components` folder.

SVGs should not be inlined, but stored in .svg files in the _components folder.
