import SwaggerUI from 'swagger-ui';
import 'swagger-ui/dist/swagger-ui.css';

const ui = SwaggerUI({
  dom_id: '#swagger',
  url: 'schemas/fingerprint-server-api-v4-with-examples.yaml',
  onComplete: () => ui.preauthorizeApiKey('ApiKeyQuery', process.env.PRIVATE_KEY),
});
