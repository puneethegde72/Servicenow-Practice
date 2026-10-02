# Project training suggestions: client reference

The client script loads a project's contacts and available training, supports contact search and selection, and sends selected contact IDs and a training ID through GlideAjax.

This folder contains the UI Page client script only. It does not include the UI Page HTML, UI Action or server-side Script Include, so it is not a complete installable feature.

## Dependencies to implement

- UI Page `practice_suggest_training` with the `practice_*` element IDs referenced in the script.
- Client-callable Script Include `x_your_scope.PracticeProjectTrainingAjax` with `getSuggestionData` and `saveSuggestions` methods.
- An authorised project/contact relationship model and a training table, for example `u_training`.

Replace `x_your_scope` with your application scope. Inspect the script's request parameters and response fields before implementing the server contract.

On the server, validate project access, the caller's update rights, the training record and every selected contact's membership in the project. Limit replacement behaviour to fields the caller may update. Client-side selections are not proof of authorisation.

Use synthetic contacts and courses in a personal development instance when completing the example.
