// @flow
//
//  Copyright (c) 2018-present, GM Cruise LLC
//
//  This source code is licensed under the Apache License, Version 2.0,
//  found in the LICENSE file in the root directory of this source tree.
//  You may not use this file except in compliance with the License.

import { parseMessageDefinition } from "rosbag";

// TODO(JP): Move all this stuff into rosbag.

type DatatypeDescription = {
  messageDefinition: string,
  type: string,
};

export type Connection = DatatypeDescription & {
  topic: string,
};

// Extract one big list of datatypes from the individual connections.
export function bagConnectionsToDatatypes(connections: $ReadOnlyArray<DatatypeDescription>) {
  const datatypes = {};
  connections.forEach((connection) => {
    const connectionTypes = parseMessageDefinition(connection.messageDefinition);
    connectionTypes.forEach(({ name, definitions }, index) => {
      // The first definition usually doesn't have an explicit name,
      // so we get the name from the connection.
      if (index === 0) {
        datatypes[connection.type] = definitions;
      } else {
        datatypes[name] = definitions;
      }
    });
  });
  return datatypes;
}

// Extract one big list of topics from the individual connections.
export function bagConnectionsToTopics(
  connections: $ReadOnlyArray<Connection>
): {| topic: string, datatype: ?string |}[] {
  // Use an object to deduplicate topics.
  const topics: { [string]: {| topic: string, datatype: ?string |} } = {};
  connections.forEach((connection) => {
    const existingTopic = topics[connection.topic];
    if (existingTopic && existingTopic.datatype !== connection.type) {
      console.warn("duplicate topic with differing datatype", existingTopic, connection);
      return;
    }
    topics[connection.topic] = {
      topic: connection.topic,
      datatype: connection.type,
    };
  });
  // Satisfy flow by using `Object.keys` instead of `Object.values`
  return Object.keys(topics).map((topic) => topics[topic]);
}
