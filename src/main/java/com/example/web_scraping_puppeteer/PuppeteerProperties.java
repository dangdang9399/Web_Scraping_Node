package com.example.web_scraping_puppeteer;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@EnableConfigurationProperties
@ConfigurationProperties(prefix = "puppeteer")
@Data
public class PuppeteerProperties {
    private String naverId;
    private String naverPw;
}
