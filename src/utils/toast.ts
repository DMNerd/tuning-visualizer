import { toast, type ToastOptions } from "react-hot-toast";

type ToastPromiseMessages = Parameters<typeof toast.promise>[1];

type Operation<T> = () => T | Promise<T>;

type ToastId = ToastOptions["id"];

export function withToastPromise<T>(
  operation: Operation<T>,
  messages: ToastPromiseMessages,
  id?: ToastId,
) {
  const options: ToastOptions | undefined = id ? { id } : undefined;
  return toast.promise(Promise.resolve().then(operation), messages, options);
}