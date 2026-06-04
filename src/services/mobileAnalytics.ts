import {
  DEFAULT_DP_CONFIG,
  DPConfig,
  privatizeDuration,
  sanitizeProperties,
} from '../utils/differentialPrivacy';
import { logger } from '../utils/logger';
import { AnalyticsEvent, EventProperties } from '../utils/trackingEvents';

/**
 * MobileAnalyticsService provides a centralized API for tracking user behavior
 * and application performance with differential privacy applied to all events.
 *
 * Privacy guarantees:
 * - All numeric properties are noise-added via the Laplace mechanism (ε-DP).
 * - All string properties are sanitized to remove PII before transmission.
 * - DP is applied per-event before any external SDK call.
 */
class MobileAnalyticsService {
  private isInitialized: boolean = false;
  private currentSessionId: string | null = null;
  private currentScreen: string | null = null;
  private dpConfig: DPConfig = { ...DEFAULT_DP_CONFIG };

  /**
   * Initialize the analytics SDK.
   */
  public async init(dpConfig?: Partial<DPConfig>): Promise<void> {
    if (this.isInitialized) return;

    if (dpConfig) {
      this.dpConfig = { ...this.dpConfig, ...dpConfig };
    }

    try {
      this.isInitialized = true;
      this.startSession();
      logger.info('MobileAnalytics: Initialized with differential privacy', {
        epsilon: this.dpConfig.epsilon,
        dpEnabled: this.dpConfig.enabled,
      });
    } catch (error) {
      logger.error('MobileAnalytics: Failed to initialize', error);
    }
  }

  /**
   * Configure the differential privacy budget at runtime.
   */
  public configureDifferentialPrivacy(config: Partial<DPConfig>): void {
    this.dpConfig = { ...this.dpConfig, ...config };
    logger.info('MobileAnalytics: DP config updated', this.dpConfig);
  }

  /** Return the current DP configuration (read-only). */
  public getDPConfig(): Readonly<DPConfig> {
    return { ...this.dpConfig };
  }

  public startSession(): void {
    const timestamp = Date.now();
    this.currentSessionId = `sess_${timestamp}_${Math.random().toString(36).substr(2, 9)}`;

    this.trackEvent(AnalyticsEvent.SESSION_START, {
      sessionId: this.currentSessionId,
      timestamp,
    });

    logger.debug(`MobileAnalytics: Session started [${this.currentSessionId}]`);
  }

  public endSession(): void {
    if (!this.currentSessionId) return;

    this.trackEvent(AnalyticsEvent.SESSION_END, {
      sessionId: this.currentSessionId,
      duration: Date.now() - parseInt(this.currentSessionId.split('_')[1]),
    });

    this.currentSessionId = null;
    logger.debug('MobileAnalytics: Session ended');
  }

  /**
   * Track a custom event with differential privacy applied to all properties.
   * Numeric properties receive Laplace noise; strings are PII-sanitized.
   */
  public trackEvent(event: AnalyticsEvent, properties?: EventProperties): void {
    const raw: Record<string, unknown> = {
      ...properties,
      screen: this.currentScreen,
      sessionId: this.currentSessionId,
      platform: 'mobile',
      timestamp: new Date().toISOString(),
    };

    const privatized = this.applyDifferentialPrivacy(raw);

    logger.info(`📊 [Analytics] Event: ${event}`, JSON.stringify(privatized, null, 2));

    // Real SDK call here: analytics().logEvent(event, privatized);
  }

  public trackScreen(screenName: string, properties?: EventProperties): void {
    const previousScreen = this.currentScreen;
    this.currentScreen = screenName;

    const payload = {
      ...properties,
      previous_screen: previousScreen,
      timestamp: new Date().toISOString(),
    };

    logger.info(`📱 [Analytics] Screen View: ${screenName}`, payload);

    this.trackEvent(AnalyticsEvent.SCREEN_VIEW, { screen: screenName, ...payload });
  }

  /**
   * Log a performance metric. Duration is privatized before logging.
   */
  public trackPerformance(name: string, value: number, properties?: EventProperties): void {
    const privatizedValue = privatizeDuration(value, 300_000, this.dpConfig);

    const payload = {
      metric_name: name,
      metric_value: privatizedValue,
      ...properties,
    };

    logger.info(`⏱️ [Analytics] Performance: ${name} = ${privatizedValue.toFixed(1)}ms`, payload);

    this.trackEvent(AnalyticsEvent.PERFORMANCE_METRIC, payload);
  }

  public async identifyUser(userId: string, userProperties?: EventProperties): Promise<void> {
    // Never log userId directly — only confirm identification occurred
    logger.info('👤 [Analytics] User identified (id suppressed by DP policy)');

    // Real SDK: await analytics().setUserId(userId);
    void userId;
    void userProperties;
  }

  public async resetUser(): Promise<void> {
    logger.info('👤 [Analytics] Reset User identity');
    // await analytics().setUserId(null);
  }

  // ─── Private DP Helpers ──────────────────────────────────────────────────

  /**
   * Apply differential privacy to a flat property bag.
   * - Numeric values: Laplace noise (sensitivity = 1, configurable ε).
   * - String values: PII sanitization (email/phone/uuid redaction).
   * - Booleans / null: passed through unchanged.
   */
  private applyDifferentialPrivacy(properties: Record<string, unknown>): Record<string, unknown> {
    if (!this.dpConfig.enabled) return properties;

    const stringProps: Record<string, unknown> = {};
    const numericProps: Record<string, unknown> = {};

    for (const [k, v] of Object.entries(properties)) {
      if (typeof v === 'number') {
        numericProps[k] = v;
      } else {
        stringProps[k] = v;
      }
    }

    const sanitized = sanitizeProperties(stringProps);

    // Add Laplace noise to each numeric field individually
    const noisyNumerics: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(numericProps)) {
      const scale = this.dpConfig.sensitivity / this.dpConfig.epsilon;
      let u = Math.random() - 0.5;
      while (u === 0) u = Math.random() - 0.5;
      const noise = -scale * Math.sign(u) * Math.log(1 - 2 * Math.abs(u));
      noisyNumerics[k] = (v as number) + noise;
    }

    return { ...sanitized, ...noisyNumerics };
  }
}

// Export a singleton instance
export const mobileAnalyticsService = new MobileAnalyticsService();
export default mobileAnalyticsService;
