const socket = io("https://letschat-sapnendra.onrender.com");

const msgInput = document.querySelector("#message");
const nameInput = document.querySelector("#name");
const chatRoom = document.querySelector("#room");
const activity = document.querySelector(".activity");
const userList = document.querySelector(".user-list");
const roomList = document.querySelector(".room-list");
const appDisplay = document.querySelector(".app");
const chatDisplay = document.querySelector(".chat-display");

const sendMessage = (event) => {
  event.preventDefault();
  if (nameInput.value && msgInput.value && chatRoom.value) {
    socket.emit("message", {
      name: nameInput.value,
      text: msgInput.value,
    });
    msgInput.value = "";
  }
  msgInput.focus();
};

const enterRoom = (event) => {
  event.preventDefault();
  if (nameInput.value && chatRoom.value) {
    socket.emit("enterRoom", {
      name: nameInput.value,
      room: chatRoom.value,
    });
  }
};

document.querySelector(".form-msg").addEventListener("submit", sendMessage);
document.querySelector(".form-join").addEventListener("submit", enterRoom);

msgInput.addEventListener("keypress", (event) => {
  socket.emit("activity", nameInput.value);
});

socket.on("message", (data) => {
  activity.textContent = "";
  const { name, text, time } = data;
  const li = document.createElement("li");
  li.className = "post";
  if (name === nameInput.value) {
    li.classList = "post post--left";
  }
  if (name !== nameInput.value && name !== "Admin") {
    li.classList = "post post--right";
  }
  if (name !== "Admin") {
    li.innerHTML = `<div class="post__header ${
      name === nameInput.value ? "post__header--user" : "post__header--reply"
    }">
                      <span class="post__header--name">${name}</span>
                      <span class="post__header--time">${time}</span>
                    </div>
                    <div class="post__text">${text}</div>`;
  } else {
    li.innerHTML = `<div class="post__text">${text}</div>`;
  }
  document.querySelector(".chat-display").appendChild(li);

  appDisplay.scrollTop = appDisplay.scrollHeight;
});

let activityTimer;
socket.on("activity", (name) => {
  activity.textContent = `${name} is typing...`;

  clearTimeout(activityTimer);
  activityTimer = setTimeout(() => {
    activity.textContent = "";
  }, 3000);
});

socket.on("userList", ({ users }) => {
  showUsers(users);
});

socket.on("roomList", ({ rooms }) => {
  showRooms(rooms);
});

const showUsers = (users) => {
  userList.textContent = "";
  if (users) {
    userList.innerHTML = `<em>Users in ${chatRoom.value} chat room: </em>`;
    users.forEach((user, idx) => {
      userList.textContent += `${user.name}`;
      if (users.length > 1 && idx !== users.length - 1) {
        userList.textContent += ", ";
      }
    });
  }
};

const showRooms = (rooms) => {
  roomList.textContent = "";
  if (rooms) {
    roomList.innerHTML = `<em>Active Rooms</em>`;
    rooms.forEach((room, idx) => {
      roomList.textContent += `${room}`;
      if (rooms.length > 1 && idx !== rooms.length - 1) {
        roomList.textContent += ",";
      }
    });
  }
};
