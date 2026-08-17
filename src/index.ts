import SwaggerUI from 'swagger-ui';
import 'swagger-ui/dist/swagger-ui.css';

let ui: SwaggerUI | undefined = undefined;
ui = SwaggerUI({
  dom_id: '#swagger',
  url: 'schemas/fingerprint-server-api-v4-with-examples.yaml',
  onComplete: () => {
    if (ui !== undefined) {
      ui.preauthorizeApiKey('ApiKeyQuery', process.env.PRIVATE_KEY);
    }
  },
});
