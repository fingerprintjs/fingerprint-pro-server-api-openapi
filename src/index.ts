import SwaggerUI from 'swagger-ui';
import 'swagger-ui/dist/swagger-ui.css';

const ui = SwaggerUI({
  dom_id: '#swagger',
  url: 'schemes/fingerprint-server-api.yaml',
  onComplete: () => ui.preauthorizeApiKey('ApiKeyQuery', process.env.PRIVATE_KEY),
});
