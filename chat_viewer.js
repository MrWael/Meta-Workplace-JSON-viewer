const e = React.createElement;

// Global variables
var cleanedData;

// File upload event listener
const fileSelector = document.getElementById('fileupload');
fileSelector.addEventListener('change', (event) => {
    const fileList = event.target.files;
    readJSON(fileList[0]);
});

// Submit button setup
const domButton = document.querySelector('#submit-button');
ReactDOM.render(
    e('button', { onClick: () => handleSubmit() }, "Submit"),
    domButton
);

function handleSubmit() {
    ReactDOM.render(e(ChatArea), document.querySelector('#chat-area'));
    const domChat = document.querySelector('#chat-display');
    ReactDOM.render(e(ChatBubble, { messages: cleanedData.messages }), domChat);
}

function readJSON(file) {
    const reader = new FileReader();

    reader.addEventListener('load', (event) => {
        const rawData = JSON.parse(event.target.result);
        cleanedData = cleanData(rawData);
        console.log("JSON loaded and cleaned:", cleanedData);
    });

    reader.readAsText(file);
}

// Decode Arabic Unicode using a correct conversion method
function convert(str) {
    // Fix for proper decoding of Unicode escape sequences
    try {
        return decodeURIComponent(escape(str));
    } catch (e) {
        console.error("Failed to decode string", e);
        return str; // Fallback in case of error
    }
}

function cleanData(rawData) {
    const messages = [];

    rawData.forEach(entry => {
        // Locate "label_values" to find potential messages
        const labelValues = entry.label_values || [];

        labelValues.forEach(label => {
            if (label.title === 'Messages' && Array.isArray(label.dict)) {
                label.dict.forEach(msgEntry => {
                    const name = msgEntry.dict.find(item => item.ent_field_name === 'Name')?.value || 'Unknown';
                    let message = msgEntry.dict.find(item => item.ent_field_name === 'Body')?.value || '';
                    const timestamp = msgEntry.dict.find(item => item.ent_field_name === 'MessagesTimestamp')?.timestamp_value;
                    let replyTo = msgEntry.dict.find(item => item.ent_field_name === 'ReplyType')?.value || null;

                    if (message) {
                        message = convert(message); // Decode Unicode to readable Arabic text
                        replyTo = convert(replyTo);
                        messages.push({
                            name,
                            message,
                            replyTo,
                            timestamp: timestamp ? new Date(timestamp * 1000).toLocaleString() : 'Unknown Time'
                        });
                    }
                });
            }
        });
    });

    return { messages };
}

const ChatArea = () => {
    return e('div', { id: 'chat-display', style: { padding: '10px', border: '1px solid #ccc' } }, null);
};

const ChatBubble = ({ messages }) => {
    return e('div', null,
        messages.map((msg, index) =>
            e('div', { key: index, style: { margin: '10px 0', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' } },
                e('p', { style: { fontWeight: 'bold' } }, `${msg.name} (${msg.timestamp}):`),
                // Hide "Replying to" if it's null or the string "null"
                msg.replyTo && msg.replyTo !== "null" ? 
                    e('p', { style: { fontStyle: 'italic', color: '#666' } }, `Replying to: ${msg.replyTo}`) : null,
                e('p', null, msg.message) // Displaying Arabic message
            )
        )
    );
};

