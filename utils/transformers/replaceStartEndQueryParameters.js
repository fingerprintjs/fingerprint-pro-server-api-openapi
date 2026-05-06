import { expandOneOfQueryParametersTransformer } from './expandOneOfQueryParametersTransformer.js';

const replacementParametersMap = {
  start: {
    overrideDescription:
      "Include events that happened after this point (with timestamp greater than or equal to the provided `start` Unix milliseconds value). Defaults to 7 days ago. Setting `start` does not change `end`'s default of `now` — adjust it separately if needed.",
    alias: {
      name: 'start_date_time',
      description: 'An alias for the `start` that accepts an RFC3339 timestamp rather than a UNIX milliseconds value.',
    },
  },
  end: {
    overrideDescription:
      "Include events that happened before this point (with timestamp less than or equal the provided `end` Unix milliseconds value). Defaults to now. Setting `end` does not change `start`'s default of `7 days ago` — adjust it separately if needed.",
    alias: {
      name: 'end_date_time',
      description: 'An alias for the `end` that accepts an RFC3339 timestamp rather than a UNIX milliseconds value.',
    },
  },
};

export function replaceStartEndQueryParameters() {
  return expandOneOfQueryParametersTransformer(replacementParametersMap);
}
