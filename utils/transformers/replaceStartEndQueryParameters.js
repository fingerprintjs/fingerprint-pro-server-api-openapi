import { expandOneOfQueryParametersTransformer } from './expandOneOfQueryParametersTransformer.js';

const replacementParametersMap = {
  start: {
    overrideDescription:
      "Include events that happened after this point (with timestamp greater than or equal to the provided `start` Unix milliseconds value). Defaults to 7 days ago. Setting `start` does not change the default of `now` for `end`/`end_date_time` — adjust it separately if needed.",
    alias: {
      name: 'start_date_time',
      description: "Include events that happened after this point (with timestamp greater than or equal to the provided `start_date_time` RFC3339 timestamp). Defaults to 7 days ago. Setting `start_date_time` does not the default of `now` for `end`/`end_date_time` — adjust it separately if needed. This parameter is an alias for `start`."
    },
  },
  end: {
    overrideDescription:
      "Include events that happened before this point (with timestamp less than or equal the provided `end` Unix milliseconds value). Defaults to now. Setting `end` does not change the default of `7 days ago` for `start`/`start_date_time` — adjust it separately if needed.",
    alias: {
      name: 'end_date_time',
      description: "Include events that happened before this point (with timestamp less than or equal the provided `end_date_time` RFC3339 timestamp). Defaults to now. Setting `end_date_time` does not change the default of `7 days ago` for `start`/`start_date_time` — adjust it separately if needed. This parameter is an alias for `end`."
    },
  },
};

export function replaceStartEndQueryParameters() {
  return expandOneOfQueryParametersTransformer(replacementParametersMap);
}
