// src/utils/authGate.ts
let _authOpInProgress = false;
export const setAuthOperationInProgress = (v: boolean) => {
  _authOpInProgress = v;
};
export const isAuthOperationInProgress = () => _authOpInProgress;
