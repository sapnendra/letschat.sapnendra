import express from "express";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";

const PORT = process.env.PORT || 3000;
const ADMIN = "Admin";
const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "public")));

const expressServer = app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

const userState = {
  users: [],
  setUsers: (newUserArray) => {
    userState.users = newUserArray;
  },
};

const io = new Server(expressServer, {
  cors: {
    origin:
      process.env.NODE_ENV === "production"
        ? false
        : ["https://letschat-sapnendra.onrender.com/", "http://localhost:3000"],
  },
});

io.on("connection", (socket) => {
  console.log(`New user ${socket.id} connected`);

  socket.on("enterRoom", ({ name, room }) => {
    const prevRoom = getUser(socket.id)?.room;

    if (prevRoom) {
      socket.leave(prevRoom);
      io.to(prevRoom).emit(
        "message",
        buildMsg(ADMIN, `${name} has left the room`)
      );
    }

    const user = activateUser(socket.id, name, room);

    if (prevRoom) {
      io.to(prevRoom).emit("userList", {
        users: getUserInRoom(prevRoom),
      });
    }

    socket.join(user.room);

    socket.emit(
      "message",
      buildMsg(ADMIN, `You have joined ${user.room} chat room.`)
    );

    socket.broadcast
      .to(user.room)
      .emit("message", 
        buildMsg(ADMIN, `${user.name} has joined the room`)
      );

    io.to(user.room).emit("userList", {
      users: getUserInRoom(user.room),
    });

    io.emit("roomList", {
      room: getAllActiveRooms(),
    });
  });

  socket.on("disconnect", () => {
    const user = getUser(socket.id);
    userLeaveApp(socket.io);
    if (user) {
      io.to(user.room).emit(
        "message",
        buildMsg(ADMIN, `${user.name} has left the room`)
      );

      io.to(user.room).emit("userList", { 
        users: getUserInRoom(user.room) 
      });

      io.emit("roomList", {
        rooms: getAllActiveRooms(),
      });
    }

    console.log(`User ${socket.id} disconnected`);
  });

  socket.on("message", ({ name, text }) => {
    const room = getUser(socket.id)?.room;
    if (room) {
      io.to(room).emit("message", buildMsg(name, text));
    }
  });

  socket.on("activity", (name) => {
    const room = getUser(socket.id)?.room;
    if (room) {
      socket.broadcast.to(room).emit("activity", name);
    }
  });
});

const buildMsg = (name, text) => {
  return {
    name,
    text,
    time: new Intl.DateTimeFormat("default", {
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
    }).format(new Date()),
  };
};

const activateUser = (id, name, room) => {
  const user = { id, name, room };
  userState.setUsers([
    ...userState.users.filter((user) => user.id !== id),
    user,
  ]);
  return user;
};

const userLeaveApp = (id) => {
  userState.setUsers(userState.users.filter((user) => user.id !== id));
};

const getUserInRoom = (room) => {
  return userState.users.filter((user) => user.room === room);
};

const getUser = (id) => {
  return userState.users.find((user) => user.id === id);
};

const getAllActiveRooms = () => {
  return Array.from(new Set(userState.users.map((user) => user.room)));
};
