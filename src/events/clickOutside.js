export function clickOutside(node) {
    // the node has been mounted in the DOM

    window.addEventListener('click', handleClick);

    function handleClick(e) {
        if (!node.contains(e.target)) {
            node.dispatchEvent(new CustomEvent('outsideclick'))
        }
    }

    return {
        destroy() {
            // the node has been removed from the DOM
            window.removeEventListener('click', handleClick)
        }
    };
}