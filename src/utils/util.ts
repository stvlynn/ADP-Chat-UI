export function generateRequestId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function getQueryVariable(variable: string) {
  const query = window.location.search.substring(1);
  const vars = query.split('&');
  for (let i = 0; i < vars.length; i++) {
    const pair = vars[i].split('=');
    if (pair[0] === variable) {
      return pair[1];
    }
  }
  return false;
}

export function arrayUnique(array: any[], key: string, timestampKey: string) {
  const map = new Map();
  const result: any[] = [];

  for (const item of array) {
    const keyValue = item[key];
    if (!map.has(keyValue)) {
      map.set(keyValue, item);
      result.push(item);
    } else {
      const existingItem = map.get(keyValue);
      if (Number(item[timestampKey]) < Number(existingItem[timestampKey])) {
        const index = result.indexOf(existingItem);
        result[index] = item;
        map.set(keyValue, item);
      }
    }
  }

  return result;
}

export function scrollToBottom(element: HTMLElement, height: number) {
  element.scrollTop = height;
}