/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import * as prismic from "@prismicio/client";
import * as prismicNext from "@prismicio/next";
import sm from "../../sm.json";

export function getPrismicClient(config = {} as any) {
  const client = prismic.createClient(sm.apiEndpoint, {
    ...config,
    accessToken: process.env.PRISMIC_ACCESS_TOKEN,
  });

  prismicNext.enableAutoPreviews({
    client,
    previewData: config.previewData,
    req: config.req,
  });

  return client;
}
