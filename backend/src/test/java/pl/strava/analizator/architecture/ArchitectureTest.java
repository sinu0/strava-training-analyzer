package pl.strava.analizator.architecture;

import com.tngtech.archunit.core.domain.JavaClasses;
import com.tngtech.archunit.core.importer.ClassFileImporter;
import com.tngtech.archunit.core.importer.ImportOption;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.classes;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;

class ArchitectureTest {

    private static JavaClasses classes;

    @BeforeAll
    static void importClasses() {
        classes = new ClassFileImporter()
                .withImportOption(ImportOption.Predefined.DO_NOT_INCLUDE_TESTS)
                .importPackages("pl.strava.analizator");
    }

    @Test
    void domain_should_not_depend_on_infrastructure() {
        noClasses().that().resideInAPackage("..domain..")
                .should().dependOnClassesThat().resideInAPackage("..infrastructure..")
                .allowEmptyShould(true)
                .check(classes);
    }

    @Test
    void domain_should_not_depend_on_application() {
        noClasses().that().resideInAPackage("..domain..")
                .should().dependOnClassesThat().resideInAPackage("..application..")
                .allowEmptyShould(true)
                .check(classes);
    }

    @Test
    void domain_should_not_use_spring() {
        noClasses().that().resideInAPackage("..domain..")
                .should().dependOnClassesThat().resideInAPackage("org.springframework..")
                .allowEmptyShould(true)
                .check(classes);
    }

    @Test
    void domain_should_not_use_jakarta_persistence() {
        noClasses().that().resideInAPackage("..domain..")
                .should().dependOnClassesThat().resideInAPackage("jakarta.persistence..")
                .allowEmptyShould(true)
                .check(classes);
    }

    @Test
    void application_should_not_depend_on_infrastructure() {
        noClasses().that().resideInAPackage("..application..")
                .should().dependOnClassesThat().resideInAPackage("..infrastructure..")
                .allowEmptyShould(true)
                .check(classes);
    }

    @Test
    void infrastructure_web_should_not_depend_on_persistence() {
        noClasses().that().resideInAPackage("..infrastructure.web..")
                .should().dependOnClassesThat().resideInAPackage("..infrastructure.persistence..")
                .allowEmptyShould(true)
                .check(classes);
    }

    @Test
    void infrastructure_web_should_not_depend_on_strava() {
        noClasses().that().resideInAPackage("..infrastructure.web..")
                .should().dependOnClassesThat().resideInAPackage("..infrastructure.strava..")
                .allowEmptyShould(true)
                .check(classes);
    }

    // --- AI Module specific rules ---

    @Test
    void domain_ai_should_not_depend_on_jackson() {
        noClasses().that().resideInAPackage("..domain.ai..")
                .should().dependOnClassesThat().resideInAPackage("com.fasterxml.jackson..")
                .allowEmptyShould(true)
                .check(classes);
    }

    @Test
    void domain_ai_should_not_depend_on_lombok_annotations_that_add_spring() {
        // Domain AI should only use pure Java + Lombok value types
        noClasses().that().resideInAPackage("..domain.ai..")
                .should().dependOnClassesThat().resideInAPackage("org.springframework..")
                .allowEmptyShould(true)
                .check(classes);
    }

    @Test
    void infrastructure_ai_should_not_depend_on_persistence() {
        noClasses().that().resideInAPackage("..infrastructure.ai..")
                .should().dependOnClassesThat().resideInAPackage("..infrastructure.persistence..")
                .allowEmptyShould(true)
                .check(classes);
    }

    @Test
    void application_ai_should_not_depend_on_infrastructure_ai() {
        noClasses().that().resideInAPackage("..application.ai..")
                .should().dependOnClassesThat().resideInAPackage("..infrastructure.ai..")
                .allowEmptyShould(true)
                .check(classes);
    }
}
