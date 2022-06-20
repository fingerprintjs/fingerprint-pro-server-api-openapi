import SwaggerUI, { SwaggerUIPlugin } from 'swagger-ui';
import 'swagger-ui/dist/swagger-ui.css';

type Dictionary<T> = { [key: string]: T };

const examples: Dictionary<any> = {};

const CustomPlugin: SwaggerUIPlugin = () => {
  return {
    wrapComponents: {
      response:
        (Original: any, { React, oas3Actions, oas3Selectors }: any) =>
        (props: any) => {
          const contentType = oas3Selectors.responseContentType(props.path, props.method);
          const externalValue = props.response.getIn([
            'content',
            contentType,
            'examples',
            props.activeExamplesKey,
            'externalValue',
          ]);
          console.log('->>!', props);
          // Check if externalValue field exists
          if (externalValue) {
            console.log(props.activeExamplesKey, examples);
            // Check if examples map already contains externalValue key
            if (examples[externalValue]) {
              // Set example value directly from examples map
              try {
                props.response = props.response.setIn(
                  ['content', contentType, 'examples', props.activeExamplesKey, 'value'],
                  examples[externalValue]
                );
              } catch (e) {}
            } else {
              // Download external file
              fetch(externalValue)
                .then((res) => res.text())
                .then((data) => {
                  // Put downloaded file content into the examples map
                  examples[externalValue] = data;
                  // Simulate select another example action
                  oas3Actions.setActiveExamplesMember({
                    name: 'fake',
                    pathMethod: [props.path, props.method],
                    contextType: 'responses',
                    contextName: props.code,
                  });
                  // Reselect this example
                  oas3Actions.setActiveExamplesMember({
                    name: props.activeExamplesKey,
                    pathMethod: [props.path, props.method],
                    contextType: 'responses',
                    contextName: props.code,
                  });
                })
                .catch((e) => console.error(e));
            }
          }
          console.log('->>', props);
          return React.createElement(Original, props);
        },
    },
  };
};

SwaggerUI({
  dom_id: '#swagger',
  url: 'schemes/fingerprint-server-api.yaml',
  plugins: [CustomPlugin],
});
