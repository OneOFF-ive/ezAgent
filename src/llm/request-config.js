import { ProxyAgent } from 'undici';
import { env } from '../config/env.js';
import {
  buildHeadersByProtocol,
  buildRequestBodyByProtocol,
  endpointPathByProtocol,
} from './protocols.js';

export function resolveTargetModel(model) {
  return model ?? env.llm.activeModel;
}

function createDispatcher() {
  if (!env.httpProxyUrl) {
    return undefined;
  }

  return new ProxyAgent(env.httpProxyUrl);
}

export function buildRequestConfig(messages, targetModel) {
  const model = resolveTargetModel(targetModel);

  return {
    model,
    requestUrl: `${model.baseUrl}${endpointPathByProtocol(model.protocol)}`,
    fetchOptions: {
      dispatcher: createDispatcher(),
      method: 'POST',
      headers: buildHeadersByProtocol(model.protocol, model),
      body: JSON.stringify(buildRequestBodyByProtocol(model.protocol, model, messages)),
    },
  };
}
