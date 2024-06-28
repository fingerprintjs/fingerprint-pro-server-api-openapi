import SwaggerUI from 'swagger-ui';
import 'swagger-ui/dist/swagger-ui.css';

const ui = SwaggerUI({
  dom_id: '#swagger',
  url: 'schemas/fingerprint-server-api.yaml',
  onComplete: () => ui.preauthorizeApiKey('ApiKeyQuery', process.env.PRIVATE_KEY),
});

const uiRelatedVisitors = SwaggerUI({
  dom_id: '#swagger-related-visitors',
  url: 'schemas/fingerprint-related-visitors-api.yaml',
  onComplete: () => uiRelatedVisitors.preauthorizeApiKey('ApiKeyQuery', process.env.PRIVATE_KEY),
});
