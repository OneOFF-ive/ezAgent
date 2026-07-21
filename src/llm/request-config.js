import { ProxyAgent } from 'undici';
import { env } from '../config/env.js';
import {
  buildHeadersByProtocol,
  buildRequestBodyByProtocol,
  endpointPathByProtocol,
} from './protocols.js';

function resolveTargetModel(model) {
  return model ?? env.llm.activeModel;
}

let proxyDispatcher;

function getDispatcher() {
  if (!env.httpProxyUrl) {
    return undefined;
  }

  // ProxyAgent 内部维护连接池；进程内复用可以避免每次 LLM 请求重复创建连接资源。
  proxyDispatcher ??= new ProxyAgent(env.httpProxyUrl);
  return proxyDispatcher;
}

export function buildRequestConfig(messages, targetModel) {
  const model = resolveTargetModel(targetModel);

  return {
    model,
    requestUrl: `${model.baseUrl}${endpointPathByProtocol(model.protocol)}`,
    fetchOptions: {
      dispatcher: getDispatcher(),
      method: 'POST',
      headers: buildHeadersByProtocol(model.protocol, model),
      body: JSON.stringify(buildRequestBodyByProtocol(model.protocol, model, messages)),
    },
  };
}
