describe("Forms", function() {
  beforeEach(function() {
  });

  it("typeNameAliasWorks", function() {
    var schema = {
      "description": "Show some stuff in a form from JSON",
    	"definitions": {
    		"foo": {
    			"type": "object",
    	    "properties": {
    	        "name": { "type": "string" },
    	        "value": { "type": "string" }
    	    }
    		}
    	},
      "properties": {
        "key": { "description": "Argument key", "type": "java.lang.String" },
        "value": { "description": "Argument value", "type": "java.lang.String" },
    		"tableValue": {
    			"description": "A table of values with nested schema properties",
    			"type": "array",
    			"items": {
    				"properties": {
    	        "key": { "type": "string" },
    	        "value": { "type": "string" }
    				}
    			}
    		},
    		"fooValue": {
    			"description": "A table of values with referenced foo type definition",
    			"type": "array",
    			"items": {
    				"type": "foo"
    			}
    		},
        "longArg": { "description": "Long argument", "type": "Long" },
        "intArg": { "description": "Int argument", "type": "Integer" }
    	}
    };
    var s1 = Forms.findArrayItemsSchema(schema.properties.tableValue, schema);
    var s2 = Forms.findArrayItemsSchema(schema.properties.fooValue, schema);

    expect(Forms.resolveTypeNameAlias(null, schema)).toEqual(null);
    expect(Forms.resolveTypeNameAlias("bar", schema)).toEqual("bar");
    expect(Forms.resolveTypeNameAlias("foo", schema)).toEqual("object");

    expect(Forms.isArrayOrNestedObject(schema.properties.key, schema)).toEqual(false);
    expect(Forms.isArrayOrNestedObject(schema.properties.value, schema)).toEqual(false);
    expect(Forms.isArrayOrNestedObject(schema.properties.tableValue, schema)).toEqual(true);
    expect(Forms.isArrayOrNestedObject(schema.properties.fooValue, schema)).toEqual(true);

    expect(s1).toEqual(schema.properties.tableValue.items);
    expect(s2).toEqual(schema.definitions.foo);

    expect(s1.properties.key.type).toEqual("string");
    expect(s2.properties.name.type).toEqual("string");
  });

});