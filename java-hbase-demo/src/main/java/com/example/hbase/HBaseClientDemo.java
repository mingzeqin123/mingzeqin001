package com.example.hbase;

import org.apache.hadoop.conf.Configuration;
import org.apache.hadoop.hbase.HBaseConfiguration;
import org.apache.hadoop.hbase.TableName;
import org.apache.hadoop.hbase.client.Admin;
import org.apache.hadoop.hbase.client.ColumnFamilyDescriptor;
import org.apache.hadoop.hbase.client.ColumnFamilyDescriptorBuilder;
import org.apache.hadoop.hbase.client.Connection;
import org.apache.hadoop.hbase.client.ConnectionFactory;
import org.apache.hadoop.hbase.client.Get;
import org.apache.hadoop.hbase.client.Put;
import org.apache.hadoop.hbase.client.Result;
import org.apache.hadoop.hbase.client.ResultScanner;
import org.apache.hadoop.hbase.client.Scan;
import org.apache.hadoop.hbase.client.Table;
import org.apache.hadoop.hbase.client.TableDescriptor;
import org.apache.hadoop.hbase.client.TableDescriptorBuilder;
import org.apache.hadoop.hbase.util.Bytes;

import java.io.File;
import java.io.IOException;
import java.util.Optional;

/**
 * Minimal demo for integrating Java with HBase (HBase 2.x client API).
 *
 * Usage:
 *   mvn -f java-hbase-demo/pom.xml -q package
 *   java -jar java-hbase-demo/target/java-hbase-demo-1.0.0.jar
 *
 * Override configuration:
 *   - Environment variables:
 *       HBASE_ZK_QUORUM=zk1,zk2,zk3
 *       HBASE_ZK_PORT=2181
 *       HBASE_ZNODE_PARENT=/hbase
 *       HBASE_CONF_DIR=/path/to/hbase-conf   (folder containing hbase-site.xml)
 *   - Or JVM properties:
 *       -Dhbase.zookeeper.quorum=...
 *       -Dhbase.zookeeper.property.clientPort=...
 *       -Dzookeeper.znode.parent=...
 *       -Dhbase.conf.dir=/path/to/hbase-conf
 *
 * Notes:
 *   - Secure (Kerberos) clusters require extra auth setup (UGI). See docs/java-hbase.md.
 */
public final class HBaseClientDemo {
  private static final byte[] CF = Bytes.toBytes("cf");
  private static final byte[] Q_NAME = Bytes.toBytes("name");

  public static void main(String[] args) throws Exception {
    TableName table = TableName.valueOf(getArg(args, "--table").orElse("demo:users"));
    boolean drop = hasFlag(args, "--drop");

    Configuration conf = buildConfiguration();
    try (Connection connection = ConnectionFactory.createConnection(conf);
         Admin admin = connection.getAdmin()) {

      ensureTable(admin, table);

      if (drop) {
        dropTable(admin, table);
        System.out.println("Dropped table: " + table.getNameAsString());
        return;
      }

      // Write a row
      byte[] rowKey = Bytes.toBytes("u1");
      putUser(connection, table, rowKey, "alice");

      // Read it back
      String name = getUserName(connection, table, rowKey);
      System.out.println("Get u1 => name=" + name);

      // Scan
      System.out.println("Scan table =>");
      scanUsers(connection, table);
    }
  }

  private static Configuration buildConfiguration() throws IOException {
    Configuration conf = HBaseConfiguration.create();

    // Optional: load external hbase-site.xml
    String confDir = firstNonBlank(
        System.getProperty("hbase.conf.dir"),
        System.getenv("HBASE_CONF_DIR")
    ).orElse(null);
    if (confDir != null) {
      File site = new File(confDir, "hbase-site.xml");
      if (site.isFile()) {
        conf.addResource(site.toURI().toURL());
      }
    }

    // Override with env vars if present (common in containerized deployments)
    setIfPresent(conf, "hbase.zookeeper.quorum", System.getenv("HBASE_ZK_QUORUM"));
    setIfPresent(conf, "hbase.zookeeper.property.clientPort", System.getenv("HBASE_ZK_PORT"));
    setIfPresent(conf, "zookeeper.znode.parent", System.getenv("HBASE_ZNODE_PARENT"));

    return conf;
  }

  private static void ensureTable(Admin admin, TableName table) throws IOException {
    if (admin.tableExists(table)) {
      return;
    }
    ColumnFamilyDescriptor family = ColumnFamilyDescriptorBuilder.newBuilder(CF).build();
    TableDescriptor desc = TableDescriptorBuilder.newBuilder(table).setColumnFamily(family).build();
    admin.createTable(desc);
    System.out.println("Created table: " + table.getNameAsString());
  }

  private static void dropTable(Admin admin, TableName table) throws IOException {
    if (!admin.tableExists(table)) {
      return;
    }
    if (admin.isTableEnabled(table)) {
      admin.disableTable(table);
    }
    admin.deleteTable(table);
  }

  private static void putUser(Connection connection, TableName tableName, byte[] rowKey, String name)
      throws IOException {
    try (Table table = connection.getTable(tableName)) {
      Put put = new Put(rowKey);
      put.addColumn(CF, Q_NAME, Bytes.toBytes(name));
      table.put(put);
    }
  }

  private static String getUserName(Connection connection, TableName tableName, byte[] rowKey)
      throws IOException {
    try (Table table = connection.getTable(tableName)) {
      Get get = new Get(rowKey).addColumn(CF, Q_NAME);
      Result result = table.get(get);
      byte[] v = result.getValue(CF, Q_NAME);
      return v == null ? null : Bytes.toString(v);
    }
  }

  private static void scanUsers(Connection connection, TableName tableName) throws IOException {
    try (Table table = connection.getTable(tableName)) {
      Scan scan = new Scan().addFamily(CF);
      try (ResultScanner scanner = table.getScanner(scan)) {
        for (Result r : scanner) {
          String row = Bytes.toString(r.getRow());
          byte[] v = r.getValue(CF, Q_NAME);
          String name = v == null ? null : Bytes.toString(v);
          System.out.println(" - row=" + row + ", name=" + name);
        }
      }
    }
  }

  private static void setIfPresent(Configuration conf, String key, String value) {
    if (value == null || value.trim().isEmpty()) {
      return;
    }
    conf.set(key, value.trim());
  }

  private static boolean hasFlag(String[] args, String flag) {
    for (String a : args) {
      if (flag.equalsIgnoreCase(a)) {
        return true;
      }
    }
    return false;
  }

  private static Optional<String> getArg(String[] args, String key) {
    for (int i = 0; i < args.length - 1; i++) {
      if (key.equalsIgnoreCase(args[i])) {
        return firstNonBlank(args[i + 1]);
      }
    }
    return Optional.empty();
  }

  private static Optional<String> firstNonBlank(String... values) {
    for (String v : values) {
      if (v != null && !v.trim().isEmpty()) {
        return Optional.of(v.trim());
      }
    }
    return Optional.empty();
  }

  private HBaseClientDemo() {}
}
