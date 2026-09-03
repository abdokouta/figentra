import { updateMetadata } from '@/';
import { getMetadata } from '@/get-metadata';
import { defineMetadata } from '@/define-metadata';
import { hasMetadata } from '@/has-metadata';
import { clearMetadata } from '@/clear-metadata';

describe('updateMetadata', () => {
  describe('Basic Update Operations', () => {
    /**
     * Test case: updateMetadata should define metadata when it doesn't exist
     *
     * This test validates that updateMetadata creates new metadata when none exists,
     * using the provided default value as input to the callback.
     */
    it('should define metadata when it does not exist', () => {
      // Arrange: Create a clean target with no existing metadata
      const target = {};
      const metadataKey = 'new-key';
      const defaultValue = 'default-value';
      const callback = jest.fn().mockReturnValue('created-value');

      // Verify no metadata exists initially
      expect(hasMetadata(metadataKey, target)).toBe(false);

      // Act: Update metadata (which should create it)
      updateMetadata(metadataKey, defaultValue, callback, target);

      // Assert: Callback should be called with default value and metadata should be created
      expect(callback).toHaveBeenCalledWith(defaultValue);
      expect(callback).toHaveBeenCalledTimes(1);
      expect(getMetadata(metadataKey, target)).toBe('created-value');
      expect(hasMetadata(metadataKey, target)).toBe(true);
    });

    /**
     * Test case: updateMetadata should update existing metadata
     *
     * This test validates that updateMetadata correctly retrieves existing metadata
     * and passes it to the callback for transformation.
     */
    it('should update existing metadata when it exists', () => {
      // Arrange: Create target with existing metadata
      const target = {};
      const metadataKey = 'existing-key';
      const defaultValue = 'default-value';
      const existingValue = 'existing-value';
      const updatedValue = 'updated-value';

      const callback = jest.fn().mockReturnValue(updatedValue);

      // Set up existing metadata
      defineMetadata(metadataKey, existingValue, target);
      expect(getMetadata(metadataKey, target)).toBe(existingValue);

      // Act: Update the existing metadata
      updateMetadata(metadataKey, defaultValue, callback, target);

      // Assert: Callback should be called with existing value (not default)
      expect(callback).toHaveBeenCalledWith(existingValue);
      expect(callback).toHaveBeenCalledTimes(1);
      expect(getMetadata(metadataKey, target)).toBe(updatedValue);
    });

    /**
     * Test case: updateMetadata should handle falsy existing values correctly
     *
     * This test ensures that falsy values (false, 0, empty string) are properly
     * distinguished from undefined and passed to the callback.
     */
    it('should handle falsy existing values correctly', () => {
      // Arrange: Test with various falsy values
      const target = {};
      const defaultValue = 'default';

      const falsyTestCases = [
        { key: 'false-key', existing: false, expected: 'false-updated' },
        { key: 'zero-key', existing: 0, expected: 'zero-updated' },
        { key: 'empty-key', existing: '', expected: 'empty-updated' },
        { key: 'null-key', existing: null, expected: 'null-updated' },
      ];

      falsyTestCases.forEach(({ key, existing, expected }) => {
        // Set up existing falsy metadata
        defineMetadata(key, existing, target);

        const callback = jest.fn().mockReturnValue(expected);

        // Act: Update the falsy metadata
        updateMetadata(key, defaultValue, callback, target);

        // Assert: Should use existing falsy value, not default
        expect(callback).toHaveBeenCalledWith(existing);
        expect(getMetadata(key, target)).toBe(expected);
      });
    });
  });

  describe('Complex Transformation Operations', () => {
    /**
     * Test case: updateMetadata should handle counter increment operations
     *
     * This test validates common counter increment patterns using updateMetadata.
     */
    it('should handle counter increment operations', () => {
      // Arrange: Create a counter metadata system
      class EventEmitter {}
      const counterKey = 'listener-count';
      const defaultCount = 0;

      // Initially no counter exists
      expect(hasMetadata(counterKey, EventEmitter)).toBe(false);

      // Act: Increment counter multiple times
      const incrementCallback = (current: number) => current + 1;

      // First increment (creates counter)
      updateMetadata(counterKey, defaultCount, incrementCallback, EventEmitter);
      expect(getMetadata<number>(counterKey, EventEmitter)).toBe(1);

      // Subsequent increments
      updateMetadata(counterKey, defaultCount, incrementCallback, EventEmitter);
      expect(getMetadata<number>(counterKey, EventEmitter)).toBe(2);

      updateMetadata(counterKey, defaultCount, incrementCallback, EventEmitter);
      expect(getMetadata<number>(counterKey, EventEmitter)).toBe(3);
    });

    /**
     * Test case: updateMetadata should handle array operations
     *
     * This test validates array manipulation operations like push, filter, and map.
     */
    it('should handle array manipulation operations', () => {
      // Arrange: Create array-based metadata
      class TaskManager {}
      const tasksKey = 'task-list';
      const defaultTasks: string[] = [];

      // Act: Add tasks to the list
      const addTaskCallback = (tasks: string[]) => [...tasks, 'new-task'];

      updateMetadata(tasksKey, defaultTasks, addTaskCallback, TaskManager);
      expect(getMetadata<string[]>(tasksKey, TaskManager)).toEqual(['new-task']);

      updateMetadata(tasksKey, defaultTasks, addTaskCallback, TaskManager);
      expect(getMetadata<string[]>(tasksKey, TaskManager)).toEqual(['new-task', 'new-task']);

      // Filter operation
      const filterCallback = (tasks: string[]) => tasks.filter((_, index) => index === 0);
      updateMetadata(tasksKey, defaultTasks, filterCallback, TaskManager);
      expect(getMetadata<string[]>(tasksKey, TaskManager)).toEqual(['new-task']);

      // Map operation
      const mapCallback = (tasks: string[]) => tasks.map((task) => `${task}-completed`);
      updateMetadata(tasksKey, defaultTasks, mapCallback, TaskManager);
      expect(getMetadata<string[]>(tasksKey, TaskManager)).toEqual(['new-task-completed']);
    });

    /**
     * Test case: updateMetadata should handle complex object updates
     *
     * This test validates deep object manipulation and merging operations.
     */
    it('should handle complex object updates', () => {
      // Arrange: Define complex metadata structure
      interface UserPreferences {
        theme: string;
        notifications: {
          email: boolean;
          push: boolean;
          sms: boolean;
        };
        language: string;
        features: string[];
      }

      class UserService {}
      const prefsKey = 'user-preferences';
      const defaultPrefs: UserPreferences = {
        theme: 'light',
        notifications: {
          email: true,
          push: false,
          sms: false,
        },
        language: 'en',
        features: [],
      };

      // Act: Various object update operations

      // Initial setup with default
      updateMetadata(prefsKey, defaultPrefs, (prefs) => prefs, UserService);
      expect(getMetadata<UserPreferences>(prefsKey, UserService)).toEqual(defaultPrefs);

      // Update theme
      const updateTheme = (prefs: UserPreferences) => ({ ...prefs, theme: 'dark' });
      updateMetadata(prefsKey, defaultPrefs, updateTheme, UserService);

      let currentPrefs = getMetadata<UserPreferences>(prefsKey, UserService);
      expect(currentPrefs.theme).toBe('dark');
      expect(currentPrefs.language).toBe('en'); // Other properties preserved

      // Update nested notifications
      const enablePush = (prefs: UserPreferences) => ({
        ...prefs,
        notifications: { ...prefs.notifications, push: true },
      });
      updateMetadata(prefsKey, defaultPrefs, enablePush, UserService);

      currentPrefs = getMetadata<UserPreferences>(prefsKey, UserService);
      expect(currentPrefs.notifications.push).toBe(true);
      expect(currentPrefs.notifications.email).toBe(true); // Other notifications preserved

      // Add features
      const addFeature = (prefs: UserPreferences) => ({
        ...prefs,
        features: [...prefs.features, 'dark-mode', 'notifications'],
      });
      updateMetadata(prefsKey, defaultPrefs, addFeature, UserService);

      currentPrefs = getMetadata<UserPreferences>(prefsKey, UserService);
      expect(currentPrefs.features).toEqual(['dark-mode', 'notifications']);
    });
  });

  describe('Property-specific Updates', () => {
    /**
     * Test case: updateMetadata should work with property-specific metadata
     *
     * This test validates updating metadata associated with specific class properties.
     */
    it('should update property-specific metadata', () => {
      // Arrange: Create class with property metadata
      class ValidationModel {
        email: string = '';
        password: string = '';
      }

      interface ValidationRules {
        required: boolean;
        minLength?: number;
        pattern?: RegExp;
        custom?: string[];
      }

      const rulesKey = 'validation-rules';
      const defaultRules: ValidationRules = { required: false };

      // Set initial rules for email
      defineMetadata(
        rulesKey,
        { required: true, pattern: /@/ },
        ValidationModel.prototype,
        'email'
      );

      // Act: Update email validation rules
      const addMinLength = (rules: ValidationRules) => ({ ...rules, minLength: 5 });
      updateMetadata(rulesKey, defaultRules, addMinLength, ValidationModel.prototype, 'email');

      // Assert: Email rules should be updated
      const emailRules = getMetadata<ValidationRules>(rulesKey, ValidationModel.prototype, 'email');
      expect(emailRules.required).toBe(true); // Preserved from original
      expect(emailRules.minLength).toBe(5); // Added by update
      expect(emailRules.pattern).toEqual(/@/); // Preserved from original

      // Act: Update password rules (starting with default)
      const setPasswordRules = (rules: ValidationRules) => ({
        ...rules,
        required: true,
        minLength: 8,
        custom: ['no-common-passwords'],
      });
      updateMetadata(
        rulesKey,
        defaultRules,
        setPasswordRules,
        ValidationModel.prototype,
        'password'
      );

      // Assert: Password rules should be created from default
      const passwordRules = getMetadata<ValidationRules>(
        rulesKey,
        ValidationModel.prototype,
        'password'
      );
      expect(passwordRules.required).toBe(true);
      expect(passwordRules.minLength).toBe(8);
      expect(passwordRules.custom).toEqual(['no-common-passwords']);

      // Email rules should remain unchanged
      const unchangedEmailRules = getMetadata<ValidationRules>(
        rulesKey,
        ValidationModel.prototype,
        'email'
      );
      expect(unchangedEmailRules.minLength).toBe(5); // Still there
    });

    /**
     * Test case: updateMetadata should distinguish between class and property metadata
     *
     * This test ensures that class-level and property-level updates are independent.
     */
    it('should distinguish between class and property metadata updates', () => {
      // Arrange: Create class with metadata at both levels
      class ConfigurableService {
        endpoint: string = '/api';
      }

      const configKey = 'config';
      const defaultConfig = { timeout: 1000 };

      // Set initial metadata at both levels
      defineMetadata(configKey, { timeout: 5000, retries: 3 }, ConfigurableService);
      defineMetadata(
        configKey,
        { timeout: 2000, endpoint: '/v1' },
        ConfigurableService.prototype,
        'endpoint'
      );

      // Act: Update class-level config
      const updateClassTimeout = (config: any) => ({ ...config, timeout: 8000 });
      updateMetadata(configKey, defaultConfig, updateClassTimeout, ConfigurableService);

      // Act: Update property-level config
      const updatePropertyEndpoint = (config: any) => ({ ...config, endpoint: '/v2' });
      updateMetadata(
        configKey,
        defaultConfig,
        updatePropertyEndpoint,
        ConfigurableService.prototype,
        'endpoint'
      );

      // Assert: Updates should be independent
      const classConfig = getMetadata(configKey, ConfigurableService);
      const propertyConfig = getMetadata(configKey, ConfigurableService.prototype, 'endpoint');

      expect(classConfig.timeout).toBe(8000); // Updated
      expect(classConfig.retries).toBe(3); // Preserved

      expect(propertyConfig.timeout).toBe(2000); // Unchanged from property
      expect(propertyConfig.endpoint).toBe('/v2'); // Updated
    });
  });

  describe('Type Safety and Error Handling', () => {
    /**
     * Test case: updateMetadata should maintain type safety
     *
     * This test validates that TypeScript type inference works correctly.
     */
    it('should maintain type safety with generic types', () => {
      // Arrange: Define strongly typed metadata
      interface ServiceConfig {
        name: string;
        version: string;
        enabled: boolean;
        ports: number[];
      }

      class MicroService {}
      const configKey = 'service-config';
      const defaultConfig: ServiceConfig = {
        name: 'default-service',
        version: '1.0.0',
        enabled: false,
        ports: [],
      };

      // Act: Type-safe updates
      const enableService = (config: ServiceConfig): ServiceConfig => ({
        ...config,
        enabled: true,
        ports: [8080, 8443],
      });

      updateMetadata(configKey, defaultConfig, enableService, MicroService);

      // Assert: Should maintain type safety
      const result = getMetadata<ServiceConfig>(configKey, MicroService);
      expect(result.enabled).toBe(true);
      expect(result.ports).toEqual([8080, 8443]);
      expect(result.name).toBe('default-service'); // From default
      expect(result.version).toBe('1.0.0'); // From default
    });

    /**
     * Test case: updateMetadata should handle callback errors gracefully
     *
     * This test validates error handling when the callback throws an exception.
     */
    it('should handle callback errors appropriately', () => {
      // Arrange: Create target with existing metadata
      const target = {};
      const metadataKey = 'error-test';
      const existingValue = 'existing';
      const defaultValue = 'default';

      defineMetadata(metadataKey, existingValue, target);

      // Act & Assert: Callback that throws should propagate the error
      const errorCallback = jest.fn().mockImplementation(() => {
        throw new Error('Callback error');
      });

      expect(() => {
        updateMetadata(metadataKey, defaultValue, errorCallback, target);
      }).toThrow('Callback error');

      // Verify callback was called with existing value
      expect(errorCallback).toHaveBeenCalledWith(existingValue);

      // Original metadata should remain unchanged
      expect(getMetadata(metadataKey, target)).toBe(existingValue);
    });
  });

  describe('Integration with Other Metadata Operations', () => {
    /**
     * Test case: updateMetadata should work with other metadata functions
     *
     * This test validates integration with clear, has, and get operations.
     */
    it('should integrate well with other metadata operations', () => {
      // Arrange: Create comprehensive test scenario
      class IntegrationTest {}
      const metadataKey = 'integration-data';
      const defaultValue = { count: 0, items: [] as string[] };

      // Start with no metadata
      expect(hasMetadata(metadataKey, IntegrationTest)).toBe(false);

      // Create metadata via update
      const initializeCallback = (data: typeof defaultValue) => ({
        ...data,
        count: 1,
        items: ['first-item'],
      });

      updateMetadata(metadataKey, defaultValue, initializeCallback, IntegrationTest);

      // Verify metadata exists and is correct
      expect(hasMetadata(metadataKey, IntegrationTest)).toBe(true);
      expect(getMetadata(metadataKey, IntegrationTest)).toEqual({
        count: 1,
        items: ['first-item'],
      });

      // Update existing metadata
      const addItemCallback = (data: typeof defaultValue) => ({
        ...data,
        count: data.count + 1,
        items: [...data.items, 'second-item'],
      });

      updateMetadata(metadataKey, defaultValue, addItemCallback, IntegrationTest);

      expect(getMetadata(metadataKey, IntegrationTest)).toEqual({
        count: 2,
        items: ['first-item', 'second-item'],
      });

      // Clear metadata
      clearMetadata(metadataKey, IntegrationTest);
      expect(hasMetadata(metadataKey, IntegrationTest)).toBe(false);

      // Update after clearing should use default again
      updateMetadata(metadataKey, defaultValue, initializeCallback, IntegrationTest);
      expect(getMetadata(metadataKey, IntegrationTest)).toEqual({
        count: 1,
        items: ['first-item'],
      });
    });

    /**
     * Test case: updateMetadata should work with inheritance
     *
     * This test validates behavior in inheritance hierarchies.
     */
    it('should work correctly with inheritance scenarios', () => {
      // Arrange: Create inheritance hierarchy
      class BaseClass {}
      class DerivedClass extends BaseClass {}

      const metadataKey = 'inheritance-update';
      const defaultValue = { level: 'none', count: 0 };

      // Define metadata on base class
      defineMetadata(metadataKey, { level: 'base', count: 1 }, BaseClass);

      // Update derived class (should use inherited value)
      const updateLevel = (data: typeof defaultValue) => ({
        ...data,
        level: 'derived',
        count: data.count + 1,
      });

      updateMetadata(metadataKey, defaultValue, updateLevel, DerivedClass);

      // Assert: Derived class should have its own metadata now
      expect(getMetadata(metadataKey, BaseClass)).toEqual({ level: 'base', count: 1 });
      expect(getMetadata(metadataKey, DerivedClass)).toEqual({ level: 'derived', count: 2 });

      // Update base class should not affect derived
      const updateBase = (data: typeof defaultValue) => ({ ...data, count: 5 });
      updateMetadata(metadataKey, defaultValue, updateBase, BaseClass);

      expect(getMetadata(metadataKey, BaseClass)).toEqual({ level: 'base', count: 5 });
      expect(getMetadata(metadataKey, DerivedClass)).toEqual({ level: 'derived', count: 2 }); // Unchanged
    });
  });

  describe('Edge Cases', () => {
    /**
     * Test case: updateMetadata should handle undefined callback return
     *
     * This test validates behavior when callback returns undefined.
     */
    it('should handle undefined callback return values', () => {
      // Arrange
      const target = {};
      const metadataKey = 'undefined-return';
      const defaultValue = 'default';
      const existingValue = 'existing';

      defineMetadata(metadataKey, existingValue, target);

      // Act: Callback returns undefined
      const undefinedCallback = jest.fn().mockReturnValue(undefined);
      updateMetadata(metadataKey, defaultValue, undefinedCallback, target);

      // Assert: Metadata should be set to undefined
      expect(undefinedCallback).toHaveBeenCalledWith(existingValue);
      expect(getMetadata(metadataKey, target)).toBeUndefined();
      expect(hasMetadata(metadataKey, target)).toBe(true); // Still exists, just undefined
    });

    /**
     * Test case: updateMetadata should work with class instances
     *
     * This test ensures the function works with class instances.
     */
    it('should work with class instances', () => {
      // Arrange: Create class and instances
      class TestClass {}
      const instance1 = new TestClass();
      const instance2 = new TestClass();

      const metadataKey = 'instance-counter';
      const defaultValue = 0;

      // Act: Update metadata on different instances
      const increment = (count: number) => count + 1;

      updateMetadata(metadataKey, defaultValue, increment, instance1);
      updateMetadata(metadataKey, defaultValue, increment, instance1); // Again
      updateMetadata(metadataKey, defaultValue, increment, instance2);

      // Assert: Instances should have independent metadata
      expect(getMetadata(metadataKey, instance1)).toBe(2);
      expect(getMetadata(metadataKey, instance2)).toBe(1);
    });
  });
});
