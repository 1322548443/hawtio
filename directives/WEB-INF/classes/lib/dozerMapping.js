var io_hawt_dozer_schema_Mapping = {
  "type" : "object",
  "id" : "urn:jsonschema:io:hawt:dozer:schema:Mapping",
  "properties" : {
    "wildcard" : {
      "type" : "boolean"
    },
    "trim-strings" : {
      "type" : "boolean"
    },
    "map-null" : {
      "type" : "boolean"
    },
    "bean-factory" : {
      "type" : "string"
    },
    "relationship-type" : {
      "type" : "string",
      "enum" : [ "CUMULATIVE", "NON_CUMULATIVE" ]
    },
    "type" : {
      "type" : "string",
      "enum" : [ "ONE_WAY", "BI_DIRECTIONAL" ]
    },
    "map-empty-string" : {
      "type" : "boolean"
    },
    "class-a" : {
      "type" : "object",
      "$ref" : "urn:jsonschema:io:hawt:dozer:schema:Class"
    },
    "class-b" : {
      "type" : "object",
      "$ref" : "urn:jsonschema:io:hawt:dozer:schema:Class"
    },
    "fieldOrFieldExclude" : {
      "type" : "array"
    },
    "date-format" : {
      "type" : "string"
    },
    "stop-on-errors" : {
      "type" : "boolean"
    },
    "map-id" : {
      "type" : "string"
    }
  }
};

