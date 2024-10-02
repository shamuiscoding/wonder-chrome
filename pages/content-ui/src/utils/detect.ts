export function modifyElement(element: Node, text: string, type: 'original' | 'modified') {
  if (type === 'original') {
    if (element instanceof HTMLElement) {
      element.id = 'uuid-' + crypto.randomUUID();
      element.style.color = '#000';
      element.style.backgroundColor = '#e6ffec'; // Light green background
      element.style.borderLeft = '4px solid #2cbe4e'; // Green left border
      element.style.paddingLeft = '10px'; // Add some padding for the border
    }
  } else {
    if (element instanceof HTMLElement) {
      element.id = 'uuid-' + crypto.randomUUID();
      element.style.color = '#000';
      element.style.backgroundColor = '#ffecec'; // Light red background
      element.style.borderLeft = '4px solid #d73a49'; // Red left border
      element.style.paddingLeft = '10px'; // Add some padding for the border
    }
  }
}

export function getSelectedElements(selection: Selection) {
  if (!selection || selection.rangeCount === 0) return [];

  const range = selection.getRangeAt(0);
  const startNode = range.startContainer;
  const endNode = range.endContainer;

  // If the selection is within a single element
  if (startNode === endNode) {
    return [startNode.nodeType === Node.TEXT_NODE ? startNode.parentElement : startNode];
  }

  // If the selection spans multiple elements
  const selectedElements: Node[] = [];
  const treeWalker = document.createTreeWalker(range.commonAncestorContainer, NodeFilter.SHOW_ELEMENT, {
    acceptNode: function (node) {
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  let currentNode = treeWalker.currentNode as Node | null;

  while (currentNode) {
    if (
      range.intersectsNode(currentNode) &&
      !selectedElements.includes(currentNode) &&
      currentNode !== range.commonAncestorContainer
    ) {
      selectedElements.push(currentNode);
    }
    currentNode = treeWalker.nextNode();
  }

  return selectedElements;
}

export function appendDiff(element: Node, text: string, type: 'original' | 'modified') {
  const diffElement = document.createElement('div');
  diffElement.id = 'uuid-' + crypto.randomUUID();
  diffElement.style.color = '#000';
  diffElement.style.backgroundColor = '#ffecec'; // Light red background
  diffElement.style.borderLeft = '4px solid #d73a49'; // Red left border
  diffElement.style.paddingLeft = '10px'; // Add some padding for the border
  diffElement.innerText = text;
  element.parentNode?.insertBefore(diffElement, element.nextSibling);
}

export function getOutermostElements(elements: Node[]) {
  const outermostElements: Node[] = [];
  for (const element of elements) {
    let isOutermost = true;
    for (const otherElement of elements) {
      if (element !== otherElement && otherElement.contains(element)) {
        isOutermost = false;
        break;
      }
    }
    if (isOutermost) {
      outermostElements.push(element);
    }
  }
  return [...new Set(outermostElements)];
}
