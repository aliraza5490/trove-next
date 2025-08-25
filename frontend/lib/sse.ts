import { EventSource } from 'eventsource';
import { getAuthToken } from './auth';
import { clientAPI } from './client-api';

const createSSE = (url: string) => {
  const token = getAuthToken();
  const fullUrl = clientAPI.getUri({ url });
  return new EventSource(fullUrl, {
    fetch: (input: string | URL, init: any) =>
      fetch(input, {
        ...init,
        headers: {
          ...init.headers,
          Authorization: `Bearer ${token}`,
        },
      }),
  });
};

export default createSSE;
