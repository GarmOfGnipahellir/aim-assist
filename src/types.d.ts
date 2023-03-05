declare class NodeModule {
  public hot: {
    dispose: (fn: (data: any) => void) => void;
    accept: (fn: (getParents: any) => void) => void;
    data: any;
  };
}

declare let joypad: {
  on: (event: string, callback: (e: any) => void) => void;
};
