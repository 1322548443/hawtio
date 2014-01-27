package io.hawt.maven;

import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Set;

import org.apache.maven.artifact.Artifact;
import org.apache.maven.plugin.MojoExecutionException;
import org.apache.maven.plugin.MojoFailureException;
import org.apache.maven.plugins.annotations.LifecyclePhase;
import org.apache.maven.plugins.annotations.Mojo;
import org.apache.maven.plugins.annotations.Parameter;
import org.apache.maven.plugins.annotations.ResolutionScope;

@Mojo(name = "run", defaultPhase = LifecyclePhase.TEST_COMPILE, requiresDependencyResolution = ResolutionScope.RUNTIME)
public class RunMojo extends BaseMojo {

    @Parameter(property = "hawtio.port", defaultValue = "8080")
    int port;

    @Parameter(property = "hawtio.context", defaultValue = "hawtio")
    String context;

    @Parameter(property = "hawtio.mainClass")
    String mainClass;

    @Parameter(property = "hawtio.arguments")
    String[] arguments;

    @Override
    public void execute() throws MojoExecutionException, MojoFailureException {
        // use hawtio-app
        extendedPluginDependencyArtifactId = "hawtio-app";

        try {
            doPrepareArguments();
            doBeforeExecute();
            doExecute();
            doAfterExecute();
        } catch (Exception e) {
            throw new MojoExecutionException("Error executing", e);
        }
    }



    protected void doPrepareArguments() throws Exception {
        List<String> args = new ArrayList<String>();

        addCustomArguments(args);

        if (arguments != null) {
            args.addAll(Arrays.asList(arguments));
        }

        arguments = new String[args.size()];
        args.toArray(arguments);

        if (getLog().isDebugEnabled()) {
            StringBuilder msg = new StringBuilder("Invoking: ");
            msg.append(mainClass);
            msg.append(".main(");
            for (int i = 0; i < arguments.length; i++) {
                if (i > 0) {
                    msg.append(", ");
                }
                msg.append(arguments[i]);
            }
            msg.append(")");
            getLog().debug(msg);
        }
    }

    /**
     * To add any custom arguments
     *
     * @param args the arguments
     */
    protected void addCustomArguments(List<String> args) throws Exception {
        // noop
    }

    protected void doExecute() throws Exception {
        if (mainClass == null) {
            throw new IllegalArgumentException("Option mainClass must be specified");
        }

        final IsolatedThreadGroup threadGroup = new IsolatedThreadGroup(this, mainClass);
        final Thread bootstrapThread = new Thread(threadGroup, new Runnable() {
            public void run() {
                try {
                    beforeBootstrapHawtio();

                    getLog().info("Starting hawtio ...");
                    getLog().info("*************************************");
                    Method hawtioMain = Thread.currentThread().getContextClassLoader().loadClass("io.hawt.app.App")
                            .getMethod("main", new Class[] {String[].class});
                    if (!hawtioMain.isAccessible()) {
                        getLog().debug("Setting accessibility to true in order to invoke main().");
                        hawtioMain.setAccessible(true);
                    }
                    String[] args = new String[]{"--context", context, "--port", "" + port, "--join", "false"};
                    hawtioMain.invoke(hawtioMain, new Object[]{args});

                    afterBootstrapHawtio();

                    beforeBootstrapMain();

                    getLog().info("Starting " + mainClass + "...");
                    getLog().info("*************************************");
                    Method main = Thread.currentThread().getContextClassLoader().loadClass(mainClass)
                            .getMethod("main", new Class[] {String[].class});
                    if (!main.isAccessible()) {
                        getLog().debug("Setting accessibility to true in order to invoke main().");
                        main.setAccessible(true);
                    }
                    main.invoke(main, new Object[] {arguments});

                    afterBootstrapMain();

                } catch (Exception e) { // just pass it on
                    // let it be printed so end users can see the exception on the console
                    getLog().error("*************************************");
                    getLog().error("Error occurred while running main from: " + mainClass);
                    getLog().error(e);
                    getLog().error("*************************************");
                    Thread.currentThread().getThreadGroup().uncaughtException(Thread.currentThread(), e);
                }
            }
        }, mainClass + ".main()");

        // resolve artifacts to be used
        Set<Artifact> artifacts = resolveArtifacts();
        resolvedArtifacts(artifacts);

        bootstrapThread.setContextClassLoader(getClassLoader(artifacts));

        bootstrapThread.start();
        joinNonDaemonThreads(threadGroup);

        try {
            terminateThreads(threadGroup);
            threadGroup.destroy();
        } catch (IllegalThreadStateException e) {
            getLog().warn("Cannot destroy thread group " + threadGroup, e);
        }

        if (threadGroup.getUncaughtException() != null) {
            throw new MojoExecutionException("Uncaught exception", threadGroup.getUncaughtException());
        }
    }

    protected void beforeBootstrapMain() {
        // noop
    }

    protected void afterBootstrapMain() {
        // noop
    }

    protected void beforeBootstrapHawtio() {
        // noop
    }

    protected void afterBootstrapHawtio() {
        // noop
    }

}
