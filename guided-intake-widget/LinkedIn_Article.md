# Turning one ServiceNow catalog item into a guided, multi-page experience

A catalog item or record producer can collect everything in one submission and still feel easy to complete. When every question appears in one long form, people have to work out where to start, which fields matter now, and how much is left. I wanted a clearer experience while keeping the underlying ServiceNow catalog process.

I built a reusable guided intake widget for ServiceNow Service Portal and shared the source publicly. It presents the questions in manageable pages, shows progress as answers are entered, and uses one final send action after a review step.

**Watch the 29-second demo:** https://github.com/puneethegde72/Servicenow-Practice/blob/main/guided-intake-widget/demo/Guided_Intake_Demo.mp4

For the LinkedIn article editor, upload the accompanying `Guided_Intake_Demo.mp4` directly below this paragraph. The video walks through the working frontend preview with sample answers; its final send screen is simulated and does not create a ServiceNow request.

## An example: a project enquiry

Imagine a single record producer called **Project enquiry**. It asks for contact details, a project type, a description of the requirement, an area of interest, and any additional information. This can remain **one record producer and one submission**. Its questions can be grouped into four pages:

1. **Your details:** company and contact information.
2. **Choose a project:** project type and a short description.
3. **Your needs:** the area of interest and likely timeline.
4. **Additional details:** anything else the requester wants to share.

In the catalog item, a **Container Start** and **Container End** pair marks each page. The Container Start question text becomes the page title. The widget reads those groups and presents one at a time. An item without page containers still works as a single-page form.

## Progress that means something

The top bar tracks completed pages. If page one of four is complete and the requester is working on page two, it reads **25%**. Each page number has its own progress ring based on answered questions on that page. If one of two questions on page two has an answer, its ring reads **50% answered**. The page number stays visible throughout; it does not turn into a tick after moving forward.

The **Continue** action appears when the current page's visible required fields are filled. Previous pages remain available to revisit. After the last page, the requester can review all answers and then use the single visible **Send request** action.

This distinction between page completion and question completion makes progress more useful. It also keeps the submit decision at the end of the flow.

## How the widget is put together

The widget wraps the standard **SC Catalog Item** widget. Its server script reads the item and regular catalog variables, including one-to-one variable sets, to build page definitions. Its client script works with the catalog form model to show the current page, track answers, and check required fields. The link function hides the embedded catalog's direct submit control and invokes that native action from the final review view. This retains the catalog widget's normal validation, submission, and redirect path.

The code keeps the layout configurable through widget options: item ID, heading, description, progress label, button labels, and a native submit selector for instances whose catalog widget uses different markup. The SCSS takes its main colors from Service Portal theme variables. The responsive layout, keyboard-focus styles, progress text, and reduced-motion rules support different portal and device settings.

## Reuse and validation

This is a starting point for a public-facing or authenticated portal, not an instance-specific export. The example copy contains no organisational details. The GitHub repository is public; guest access to a ServiceNow portal is a separate configuration decision involving the page, widgets, catalog item availability, and applicable access rules.

The navigation logic has local syntax and behavior checks. Before using it in production, I would test the actual catalog item in a subproduction portal, especially conditional UI policies, attachments, multi-row variable sets, custom variable widgets, and the native submit markup for that ServiceNow release. The included frontend preview is an interactive illustration; it does not submit a real ServiceNow request.

Source, setup instructions, and test: https://github.com/puneethegde72/Servicenow-Practice/tree/main/guided-intake-widget

Interactive preview source: https://github.com/puneethegde72/Servicenow-Practice/tree/main/guided-intake-widget/demo

If you have built a similar guided flow in Service Portal, I would be interested in how you handled conditional fields and record producers.

#ServiceNow #ServicePortal #ServiceCatalog #UserExperience #OpenSource
