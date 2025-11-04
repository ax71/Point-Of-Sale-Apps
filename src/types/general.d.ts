export type FormState = {
  status?: string;
  errors?: {
    _form?: string[];
  };
};

export type Preview = {
  file: File;
  displayUrl: string;
};
