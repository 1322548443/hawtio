# hawtio Maven Plugins
**Available as of hawtio 1.2.1**

**hawtio** offers a number of Maven Plugins, so that users can bootup Maven projects and have **hawtio** embedded in the running JVM.

## Maven Goals

**hawtio** offers the following Maven Goals, and each goal is futther documented below:

<table class="table">
  <tr>
    <th>Goal</th>
    <th>Description</th>
  </tr>
  <tr>
    <td>run</td>
    <td>This goal runs the Maven project, by executing the configured *mainClass* (as a public static void main)</td>
  </tr>  
  <tr>
    <td>spring</td>
    <td>This goal runs the Maven project as a Spring application, by loading Spring XML configurations files from the classpath or file system.</td>
  </tr>    
  <tr>
    <td>camel</td>
    <td>This goal is an extension to the <a href="http://camel.apache.org/camel-maven-plugin.html">Apache Camel Maven Plugins</a>, allowing to run the Camel Maven project and have **hawtio** embedded. This allows users to gain visibility into the running JVM, and see what happens, such as live visualization of the Camel routes, and being able to debug and profile routes, and much more, offered by the <a href="http://hawt.io/plugins/camel/">Camel plugin</a>.</td>
  </tr>
  <tr>
    <td>camel-blueprint</td>
    <td>The same as the camel goal but needed when using OSGi Blueprint Camel applications.</td>
  </tr>         
</table>


### Common Maven Goal configuration

All of the **hawtio** Maven Plugins provides the following common options:

<table class="table">
  <tr>
    <th>Option</th>
    <th>Default</th>
    <th>Description</th>
  </tr>
  <tr>
    <td>logClasspath</td>
    <td>false</td>
    <td>Whether to log the classpath.</td>
  </tr>  
  <tr>
    <td>logDependencies</td>
    <td>false</td>
    <td>Whether to log resolved Maven dependencies.</td>
  </tr>  
  <tr>
    <td>offline</td>
    <td>false</td>
    <td>Whether to run **hawtio** in offline mode. Some of the hawtio plugins requires online connection to the internet.</td>
  </tr>  
</table>



### run Maven Goal configuration

Currently all of the **hawtio** Maven Plugins provides the following common options:

<table class="table">
  <tr>
    <th>Option</th>
    <th>Default</th>
    <th>Description</th>
  </tr>
  <tr>
    <td>context</td>
    <td>hawtio</td>
    <td>The context-path to use for the embedded **hawtio** web console.</td>
  </tr>  
  <tr>
    <td>port</td>
    <td>8080</td>
    <td>The port number to use for the embedded **hawtio** web console.</td>
  </tr>  
  <tr>
    <td>mainClass</td>
    <td></td>
    <td>The fully qualified name of the main class to executed to bootstrap the Maven project. This option is required, and must be a public static void main Java class.</td>
  </tr>  
  <tr>
    <td>arguments</td>
    <td></td>
    <td>Optional arguments to pass to the main class.</td>
  </tr>  
  <tr>
    <td>systemProperties</td>
    <td></td>
    <td>Optional system properties to set on the JVM.</td>
  </tr>  
</table>


### spring Maven Goal configuration

The spring goal extends the run goal and provides the following additional options:

<table class="table">
  <tr>
    <th>Option</th>
    <th>Default</th>
    <th>Description</th>
  </tr>
  <tr>
    <td>applicationContextUri</td>
    <td>META-INF/spring/*.xml</td>
    <td>Location on class-path to look for Spring XML files. Mulutple paths can be seperated with semi colon. Only either one of applicationContextUri or fileApplicationContextUri can be in use.</td>
  </tr> 
  <tr>
    <td>fileApplicationContextUri</td>
    <td></td>
    <td>Location on file system to look for Spring XML files. Mulutple paths can be seperated with semi colon. Only either one of applicationContextUri or fileApplicationContextUri can be in use.</td>
  </tr>     
</table>


### camel Maven Goal configuration

The camel goal extends the run goal and provides the following additional options:

<table class="table">
  <tr>
    <th>Option</th>
    <th>Default</th>
    <th>Description</th>
  </tr>
  <tr>
    <td>applicationContextUri</td>
    <td>META-INF/spring/*.xml</td>
    <td>Location on class-path to look for Spring XML files. Mulutple paths can be seperated with semi colon. Only either one of applicationContextUri or fileApplicationContextUri can be in use.</td>
  </tr> 
  <tr>
    <td>fileApplicationContextUri</td>
    <td></td>
    <td>Location on file system to look for Spring XML files. Mulutple paths can be seperated with semi colon. Only either one of applicationContextUri or fileApplicationContextUri can be in use.</td>
  </tr>     
</table>

By default the camel plugin will assume the application is a Camel spring application and use the applicationContextUri or fileApplicationContextUri to use as Spring XML files. By configurign a custom mainClass, then the Camel application is using the custom mainClass to bootstrap the Camel application, and neither applicationContextUri, nor fileApplicationContextUri are in use.

### camel-blueprint Maven Goal configuration

The camel goal extends the run goal and provides the following additional options:

<table class="table">
  <tr>
    <th>Option</th>
    <th>Default</th>
    <th>Description</th>
  </tr>
  <tr>
    <td>applicationContext</td>
    <td>OSGI-INF/blueprint/*.xml</td>
    <td>Location on class-path to look for Blueprint XML files. Mulutple paths can be seperated with semi colon. Only either one of applicationContext or fileApplicationContext can be in use.</td>
  </tr> 
  <tr>
    <td>fileApplicationContext</td>
    <td></td>
    <td>Location on file-system to look for Blueprint XML files. Mulutple paths can be seperated with semi colon. Only either one of applicationContext or fileApplicationContext can be in use.</td>
  </tr> 
  <tr>
    <td>configAdminPid</td>
    <td></td>
    <td>To use a custom config admin persistence id. The configAdminFileName must be configured as well.</td>
  </tr> 
  <tr>
    <td>configAdminFileName</td>
    <td></td>
    <td>Location of the configuration admin configuration file</td>
  </tr>     
</table>


## Configuring hawtio Maven Plugin in pom.xml

In the Maven pom.xml file, the **hawtio** plugin is configured by adding the following in the &lt;build&gt;&lt;plugin&gt;section:

    <plugin>
      <groupId>io.hawt</groupId>
      <artifactId>hawtio-maven-plugin</artifactId>
      <version>1.2.1</version>
      <configuration>
        <!-- configuration options goes here -->
      </configuration>
    </plugin>

In the &lt;configuration&gt; section we can configure the plugin with any of the options mentioned before. For example to log the classpath:

      <configuration>
        <logClasspath>true</logClasspath>
      </configuration>

And to change the port number from 8080 to 8090 do:

      <configuration>
        <logClasspath>true</logClasspath>
        <port>8090</port>
      </configuration>

And to set a number of system properties to the JVM, such as the JVM http proxy settings is simply done within the nested &lt;systemProperties&gt; tag:

      <configuration>
        <logClasspath>true</logClasspath>
        <port>8090</port>
        <systemProperties>
          <http.proxyHost>myproxyserver.org</http.proxyHost>
          <http.proxyPort>8081<http.proxyPort>
        </systemProperties>  
      </configuration>


## Camel Examples

The <a href="http://camel.apache.org/download.html">Apache Camel distributons</a> includes a number of examples, which you can try out using Maven plugins.

For example to try the Camel console from a shell type:

    cd examples
    cd camel-example-console
    mvn compile
    mvn camel:run

To run the same example with **hawtio** embedded as a web console, you simply do

    cd examples
    cd camel-example-console
    mvn compile
    mvn io.hawt:hawtio-maven-plugin:1.2.1:camel

Where 1.2.1 is the **hawtio** version to use.

### Adding hawtio plugin to the Apache Camel examples

In any Maven pom.xml file you can include the **hawtio** Maven plugin. For example to include the hawtio plugin in the Camel console example, you edit the pom.xml file in examples/camel-example-console directory. 

In the &lt;build&gt;&lt;plugin&gt;section add the following xml code:

    <plugin>
      <groupId>io.hawt</groupId>
      <artifactId>hawtio-maven-plugin</artifactId>
      <version>1.2.1</version>
    </plugin>

And you can run the console example simply by typing

    mvn hawtio:camel

And the example is started together with the embedded **hawtio** web console, such as the screenshot below illustrates:

<img src="https://raw.github.com/hawtio/hawtio/master/docs/images/camel-example-console.png" alt="screenshot">


