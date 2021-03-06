const socket = io()

const messageForm = document.querySelector('.message-form');
const messageInput = document.querySelector('.message-input');
const messageButton = messageForm.querySelector('button');
const shareLocationButton = document.querySelector('.share-location-button');
const messages = document.querySelector('.messages');

const hamButton = document.querySelector('.ham-button');
const chatSidebar = document.querySelector('.chat__sidebar');

const messageTemplate = document.querySelector('.message-template').innerHTML;
const locationMessageTemplate = document.querySelector('.location-message-template').innerHTML;
const sidebarTemplate = document.querySelector('.sidebar-template').innerHTML;

const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

const autoscroll = () => {
    const newMessage = messages.lastElementChild;

    const newMessageStyles = getComputedStyle(newMessage);
    const newMessageMargin = parseInt(newMessageStyles.marginBottom);
    const newMessageHeight = newMessage.offsetHeight + newMessageMargin;

    const messagesVisibleHeight = messages.offsetHeight;

    const messagesContainerHeight = messages.scrollHeight;

    const scrollOffset = Math.round(messages.scrollTop) + messagesVisibleHeight;

    const clientIsAtBottomOfMessages = messagesContainerHeight - newMessageHeight <= scrollOffset;

    if (clientIsAtBottomOfMessages) {
        messages.scrollTop = messages.scrollHeight;
    }
}

socket.on("message", (message) => {
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format("h:mm a")
    });

    messages.insertAdjacentHTML('beforeend', html);
    autoscroll();
})

socket.on("locationMessage", (message) => {
    const html = Mustache.render(locationMessageTemplate, {
        username: message.username,
        url: message.url,
        createdAt: moment(message.createdAt).format("h:mm a")
    })

    messages.insertAdjacentHTML('beforeend', html);
    autoscroll();
})

socket.on("roomData", ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })

    document.querySelector("#sidebar").innerHTML = html
})

messageForm.addEventListener('submit', (e) => {
    e.preventDefault();
    messageInput.focus();

    messageButton.setAttribute("disabled", "disabled");

    socket.emit("sendMessage", messageInput.value, (error) => {

        messageButton.removeAttribute("disabled");
        messageInput.value = "";

        if (error)
            return console.log(error);
    });

})

shareLocationButton.addEventListener("click", () => {
    if (!navigator.geolocation)
        return alert("Geolocation is not supported by your browser")

    shareLocationButton.setAttribute("disabled", "disabled");

    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit("sentLocation", {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, () => {
            shareLocationButton.removeAttribute("disabled");
        })
    }, (error) => {
        alert("Sharing location failed, please check your location permission.")
        console.log("Sharing location failed");
        console.log(error);
    })

})

socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error);
        location.href = '/';
    }
})

hamButton.addEventListener("click", () => {
    chatSidebar.classList.toggle("show-chat-sidebar");
    hamButton.classList.toggle("ham-button-close");
})