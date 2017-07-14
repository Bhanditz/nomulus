// Copyright 2017 The Nomulus Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package google.registry.reporting;

import static com.google.common.truth.Truth.assertThat;

import com.google.common.collect.ImmutableList;
import com.google.common.collect.ImmutableMap;
import java.io.IOException;
import org.joda.time.DateTime;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.junit.runners.JUnit4;

/** Unit tests for {@link ActivityReportingQueryBuilder}. */
@RunWith(JUnit4.class)
public class ActivityReportingQueryBuilderTest {

  @Test
  public void testQueryMatch() throws IOException {
    ImmutableList<String> queryNames =
        ImmutableList.of(
            ActivityReportingQueryBuilder.REGISTRAR_OPERATING_STATUS,
            ActivityReportingQueryBuilder.DNS_COUNTS,
            ActivityReportingQueryBuilder.MONTHLY_LOGS,
            ActivityReportingQueryBuilder.EPP_METRICS,
            ActivityReportingQueryBuilder.WHOIS_COUNTS,
            "activity_report_aggregation");

    ImmutableMap.Builder<String, String> testQueryBuilder = ImmutableMap.builder();
    for (String queryName : queryNames) {
      String testFilename = String.format("%s_test.sql", queryName);
      testQueryBuilder.put(queryName, ReportingTestData.getString(testFilename));
    }
    ImmutableMap<String, String> testQueries = testQueryBuilder.build();
    ImmutableMap<String, String> queries =
        ActivityReportingQueryBuilder.getQueryMap(new DateTime(2017, 05, 15, 0, 0));
    for (String query : queryNames) {
      assertThat(queries.get(query)).isEqualTo(testQueries.get(query));
    }
  }
}