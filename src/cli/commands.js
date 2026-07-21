import {
  clearMessages,
  autoSaveCurrentSession,
  getCurrentModel,
  getMemoryStats,
  getModelById,
  getSessionInfo,
  listSavedSessions,
  loadCurrentSession,
  switchModel,
} from './state.js';
import {
  printCommandError,
  printCurrentAgent,
  printCurrentModel,
  printHelp,
  printMemoryStats,
  printMessagesCleared,
  printModelNotFound,
  printModelSwitchUsage,
  printSavedSessions,
  printSessionInfo,
  printSessionLoaded,
  printSessionLoadUsage,
  printSessionNotFound,
  printModelSwitched,
  printRegisteredModels,
} from './view.js';

function commandArgument(trimmed, command) {
  return trimmed.slice(command.length).trim();
}

function safelyRunCommand(action) {
  try {
    action();
  } catch (error) {
    printCommandError(error);
  }
}

function loadSessionById(state, sessionId) {
  if (!sessionId) {
    printSessionLoadUsage();
    return;
  }

  const loadedSession = loadCurrentSession(state, sessionId);

  if (!loadedSession) {
    printSessionNotFound(sessionId);
    return;
  }

  printSessionLoaded(loadedSession);
}

function switchModelById(state, modelId) {
  const nextModel = switchModel(state, modelId);

  if (!nextModel) {
    printModelNotFound(modelId);
    printRegisteredModels(state.currentModelId, getModelById);
    return;
  }

  printModelSwitched(nextModel);
}

function handleSessionCommand(trimmed, state) {
  if (trimmed === '/session') {
    printSessionInfo(getSessionInfo(state));
    return true;
  }

  if (trimmed === '/session list') {
    safelyRunCommand(() => {
      printSavedSessions(listSavedSessions(state), state.activeSession);
    });
    return true;
  }

  if (trimmed === '/session load') {
    printSessionLoadUsage();
    return true;
  }

  if (trimmed.startsWith('/session load ')) {
    safelyRunCommand(() => loadSessionById(state, commandArgument(trimmed, '/session load')));
    return true;
  }

  return false;
}

function handleModelCommand(trimmed, state) {
  if (trimmed === '/model') {
    printCurrentModel(getCurrentModel(state));
    return true;
  }

  if (trimmed === '/model list') {
    printRegisteredModels(state.currentModelId, getModelById);
    return true;
  }

  if (trimmed === '/model switch') {
    printModelSwitchUsage();
    return true;
  }

  if (trimmed.startsWith('/model switch ')) {
    switchModelById(state, commandArgument(trimmed, '/model switch'));
    return true;
  }

  return false;
}

export function handleCommand(trimmed, state) {
  if (trimmed === '/help') {
    printHelp();
    return true;
  }

  if (trimmed === '/agent') {
    printCurrentAgent(state.agent);
    return true;
  }

  if (trimmed === '/memory') {
    printMemoryStats(getMemoryStats(state));
    return true;
  }

  if (handleSessionCommand(trimmed, state)) {
    return true;
  }

  if (handleModelCommand(trimmed, state)) {
    return true;
  }

  if (trimmed === '/clear') {
    clearMessages(state);
    safelyRunCommand(() => {
      autoSaveCurrentSession(state);
    });
    printMessagesCleared();
    return true;
  }

  return false;
}
