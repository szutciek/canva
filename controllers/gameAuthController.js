const jwt = require("jsonwebtoken");
const { jwtSecret } = require("../config");
const { validateId } = require("../utils/validators");
const UserError = require("../utils/UserError.js");
const clients = require("../state/clients");

const signToken = (id) => {
  return jwt.sign(
    {
      exp: Math.floor(Date.now() / 1000) + 60 * 60,
      id,
    },
    jwtSecret
  );
};

const decodeToken = (token) => {
  const payload = jwt.verify(token, jwtSecret);

  if (!validateId(payload.id)) console.log("Id includes invalid characters");

  return payload;
};

const findUser = async (id) => {
  return {
    name: "Developer",
  };
};

exports.handleAuthClient = async (data, ws) => {
  try {
    if (!data.token) throw new UserError("Error while decoding token", 400);

    // const id = decodeToken(data.token);
    // if (!id) throw new UserError("Error while decoding token", 400);
    const id = "kpdsadk";

    const user = await findUser(id);
    if (!user) throw new UserError("Error while finding user", 400);

    const uuid = crypto.randomUUID();

    clients.addClient(uuid, user, ws);
    ws.uuid = uuid;

    ws.send(
      JSON.stringify({
        type: "authClientOk",
        data: {
          uuid,
          name: user.name,
        },
      })
    );
  } catch (err) {
    throw err;
  }
};

exports.handleClientLeave = (uuid) => {
  clients.removeClient(uuid);
  console.log(`Client disconnected. Now online: ${clients.size}`);
};
