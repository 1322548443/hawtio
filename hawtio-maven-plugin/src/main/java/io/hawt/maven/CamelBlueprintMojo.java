package io.hawt.maven;

import java.util.List;
import java.util.Set;

import org.apache.maven.artifact.Artifact;
import org.apache.maven.plugin.MojoExecutionException;
import org.apache.maven.plugins.annotations.LifecyclePhase;
import org.apache.maven.plugins.annotations.Mojo;
import org.apache.maven.plugins.annotations.Parameter;
import org.apache.maven.plugins.annotations.ResolutionScope;

@Mojo(name = "camel-blueprint", defaultPhase = LifecyclePhase.TEST_COMPILE, requiresDependencyResolution = ResolutionScope.RUNTIME)
public class CamelBlueprintMojo extends RunMojo {

    @Parameter(property = "camel.configAdminPid")
    private String configAdminPid;

    @Parameter(property = "camel.configAdminFileName")
    private String configAdminFileName;

    @Override
    protected void addCustomArguments(List<String> args) {
        // must include plugin dependencies for blueprint
        extraPluginDependencyArtifactId = "camel-test-blueprint";

        if (configAdminPid != null) {
            args.add("-pid");
            args.add(configAdminPid);
        }
        // set the configAdmin pFile
        if (configAdminFileName != null) {
            args.add("-pf");
            args.add(configAdminFileName);
        }

        if (mainClass != null) {
            getLog().info("Using custom " + mainClass + " to initiate a CamelContext");
        } else {
            // use blueprint by default
            getLog().info("Using org.apache.camel.test.blueprint.Main to initiate a CamelContext");
            mainClass = "org.apache.camel.test.blueprint.Main";
        }
    }

    protected Artifact getCamelCoreArtifact(Set<Artifact> artifacts) throws MojoExecutionException {
        for (Artifact artifact : artifacts) {
            if (artifact.getGroupId().equals("org.apache.camel") && artifact.getArtifactId().equals("camel-core")) {
                return artifact;
            }
        }
        return null;
    }

    protected Artifact getCamelBlueprintArtifact(Set<Artifact> artifacts) throws MojoExecutionException {
        for (Artifact artifact : artifacts) {
            if (artifact.getGroupId().equals("org.apache.camel") && artifact.getArtifactId().equals("camel-test-blueprint")) {
                return artifact;
            }
        }
        return null;
    }

    @Override
    protected void resolvedArtifacts(Set<Artifact> artifacts) throws Exception {
        Artifact camelCore = getCamelCoreArtifact(artifacts);
        if (camelCore == null) {
            throw new IllegalAccessError("Cannot resolve camel-core dependency from the Maven pom.xml file");
        }

        // try to find camel-test-blueprint which we need
        Artifact camelTestBlueprint = getCamelBlueprintArtifact(artifacts);
        if (camelTestBlueprint == null) {
            camelTestBlueprint = artifactFactory.createArtifact("org.apache.camel", "camel-test-blueprint", camelCore.getVersion(), null, "jar");
            Set<Artifact> extras = resolveExecutableDependencies(camelTestBlueprint);
            if (extras.isEmpty()) {
                throw new IllegalAccessError("Cannot resolve camel-test-blueprint dependency from the Maven pom.xml file");
            }

            for (Artifact extra : extras) {
                getLog().debug("Extra artifact: " + extra);
                if (Artifact.SCOPE_TEST.equals(extra.getScope())) {
                    continue;
                }
                if (!artifacts.contains(extra)) {
                    getLog().debug("Adding extra artifact: " + extra);
                    artifacts.add(extra);
                }
            }
        }

        super.resolvedArtifacts(artifacts);
    }

}
