"use strict";
/**************************************************
公有云 - api网关 webscoket注册函数
参考: https://cloud.tencent.com/document/product/583/32553
***************************************************/

// API网关的反向推送链接
const sendbackHost = "*******";
// MySql数据库账号信息,需要提前创建好数据库和表单,表单中新建2列：`ConnectionID`, `Date`
const Host = "**";
const User = "**";
const Password = "**";
const Port = 61631;
const DB = "SCF_Demo";
const Table = "ConnectionID_List";

const mysql = require("mysql");
const dayjs = require("dayjs");
const http = require("http");

function wrapPromise(connection, sql) {
  return new Promise((res, rej) => {
    connection.query(sql, function(error, results, fields) {
      if (error) {
        rej(error);
      }
      res(results);
    });
  });
}

async function deleteConnectionId(connectionID) {
  const connection = mysql.createConnection({
    host: Host,
    user: User,
    password: Password,
    database: DB,
    port: Port
  });

  let querySpl = `delete from ${Table} where ConnectionID = '${connectionID}'`;

  let queryResult = await wrapPromise(connection, querySpl);
  connection.end();

  return queryResult;
}

function close(connectionId) {
  let retmsg = {};
  retmsg = {};
  retmsg["websocket"] = {};
  retmsg["websocket"]["action"] = "closing";
  retmsg["websocket"]["secConnectionID"] = connectionId;

  let postData = JSON.stringify(retmsg)

  await new Promise((resolve, rej) => {
    const req = http.request(
      {
        method: "POST",
        host: "**", // 反向推送的host
        path: "**", // 反向推送的路径
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(postData)
        }
      },
      res => {
        console.log(`STATUS: ${res.statusCode}`);
        console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
        res.setEncoding("utf8");
        res.on("data", chunk => {
          console.log(`BODY: ${chunk}`);
        });
        res.on("end", () => {
          console.log("No more data in response.");
        });
        resolve();
      }
    );

    req.on("error", e => {
      console.error(`problem with request: ${e.message}`);
    });

    // write data to request body
    req.write(postData);

    req.end();
  });
}

exports.main_handler = async (event, context, callback) => {
  console.log("event is", event);

  if (!event.websocket) {
    return { errNo: 102, errMsg: "not found web socket" };
  }

  let connectionID = event["websocket"]["secConnectionID"];

  console.log("connecting: connection id", connectionID);

  console.log("Start DB Request", new dayjs().format("YYYY-MM-DD HH:mm:ss"));

  await deleteConnectionId(connectionID);

  // 如果是主动断开连接
  // await close(connectionID)

  console.log("Finish DB Request", new dayjs().format("YYYY-MM-DD HH:mm:ss"));

  return "send success";
};
