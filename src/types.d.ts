declare class NodeModule {
  public hot: {
    dispose: (fn: (data: any) => void) => void;
    accept: (fn: (getParents: any) => void) => void;
    data: any;
  };
}
